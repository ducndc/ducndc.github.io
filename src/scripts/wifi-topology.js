// Wi-Fi Topology Visualizer: floor plan, propagation model, mesh backhaul and client association.
// Everything runs in the browser; state lives in localStorage and can be shared via the URL hash.

/* ------------------------------------------------------------------ *
 * Radio model
 * ------------------------------------------------------------------ */
const BANDS = ['2.4', '5', '6'];
const BAND_MHZ = { '2.4': 2437, '5': 5500, '6': 6525 };
const BAND_COLOR = { '2.4': '#f2a93b', '5': '#4c8dff', '6': '#3fb27f' };
// Free-space loss at 1 m: 20·log10(f MHz) − 27.55
const PL1M = Object.fromEntries(BANDS.map((b) => [b, 20 * Math.log10(BAND_MHZ[b]) - 27.55]));
// Approximate wall losses in dB at 2.4 / 5 / 6 GHz
const MATERIALS = {
	drywall: { name: 'Drywall', loss: [3, 4, 5], color: '#7d899c', width: 3 },
	glass: { name: 'Glass (low-E)', loss: [4, 7, 8], color: '#5fc3e4', width: 3 },
	wood: { name: 'Wood door', loss: [3, 5, 6], color: '#c8925a', width: 5 },
	brick: { name: 'Brick', loss: [6, 10, 12], color: '#d0654b', width: 6 },
	concrete: { name: 'Concrete', loss: [12, 20, 23], color: '#b8c0cc', width: 8 },
	metal: { name: 'Metal', loss: [26, 32, 35], color: '#eef2f7', width: 7 },
};
const BAND_IDX = { '2.4': 0, '5': 1, '6': 2 };
// Required SNR (dB) and 20 MHz, 1-stream PHY rate (Mb/s, 0.8 µs GI) per MCS. MCS 12–13 are Wi-Fi 7 (4096-QAM).
const MCS_SNR = [5, 8, 11, 14, 18, 22, 24, 26, 30, 32, 35, 38, 41, 44];
const MCS_RATE = [8.6, 17.2, 25.8, 34.4, 51.6, 68.8, 77.4, 86.0, 103.2, 114.7, 129.0, 143.4, 154.9, 172.1];
const TONES = { 20: 234, 40: 468, 80: 980, 160: 1960, 320: 3920 };
const NOISE_FIGURE = 7;
const MAC_EFFICIENCY = 0.65;
const WIRED_MBPS = 940;
const CCA_DBM = -82;
const STANDARDS = {
	wifi6: { name: 'Wi-Fi 6 (802.11ax)', maxMcs: 11, bands: ['2.4', '5'], maxBw: { '2.4': 40, '5': 160, '6': 0 } },
	wifi6e: { name: 'Wi-Fi 6E', maxMcs: 11, bands: ['2.4', '5', '6'], maxBw: { '2.4': 40, '5': 160, '6': 160 } },
	wifi7: { name: 'Wi-Fi 7 (802.11be)', maxMcs: 13, bands: ['2.4', '5', '6'], maxBw: { '2.4': 40, '5': 160, '6': 320 } },
};
const CHANNELS = {
	'2.4': { 20: [1, 6, 11], 40: [3, 11] },
	'5': {
		20: [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 149, 153, 157, 161, 165],
		40: [38, 46, 54, 62, 102, 110, 118, 126, 134, 142, 151, 159],
		80: [42, 58, 106, 122, 138, 155],
		160: [50, 114],
	},
	'6': {
		20: Array.from({ length: 59 }, (_, i) => 1 + 4 * i),
		40: Array.from({ length: 29 }, (_, i) => 3 + 8 * i),
		80: Array.from({ length: 14 }, (_, i) => 7 + 16 * i),
		160: [15, 47, 79, 111, 143, 175, 207],
		320: [31, 95, 159],
	},
};

const segIntersect = (ax, ay, bx, by, cx, cy, dx, dy) => {
	const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
	if (Math.abs(d) < 1e-9) return false;
	const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d;
	const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
	return t > 0 && t < 1 && u > 0 && u < 1;
};

function wallLoss(state, x1, y1, x2, y2, band) {
	let loss = 0;
	for (const w of state.walls) {
		if (segIntersect(x1, y1, x2, y2, w.x1, w.y1, w.x2, w.y2)) loss += MATERIALS[w.mat].loss[BAND_IDX[band]];
	}
	return loss;
}

function pathLoss(state, x1, y1, x2, y2, band) {
	const d = Math.max(Math.hypot(x2 - x1, y2 - y1), 0.5);
	return PL1M[band] + 10 * state.settings.n * Math.log10(d) + wallLoss(state, x1, y1, x2, y2, band);
}

const txPower = (state, band) => state.settings.tx[band];

/** Best PHY rate for an RSSI, trying every channel width up to the configured one (real radios fall back too). */
function bestRate(state, rssi, band, nss) {
	const std = STANDARDS[state.settings.std];
	const cfgBw = Math.min(state.settings.bw[band], std.maxBw[band]);
	let best = { mcs: -1, bw: 0, phy: 0, snr: -99 };
	for (const bw of [20, 40, 80, 160, 320]) {
		if (bw > cfgBw) break;
		const noise = -174 + 10 * Math.log10(bw * 1e6) + NOISE_FIGURE;
		const snr = rssi - noise;
		let mcs = -1;
		for (let m = 0; m <= std.maxMcs; m++) if (snr >= MCS_SNR[m]) mcs = m;
		if (mcs < 0) continue;
		const phy = (MCS_RATE[mcs] * TONES[bw]) / 234 * nss;
		if (phy > best.phy) best = { mcs, bw, phy, snr };
	}
	return { ...best, tput: best.phy * MAC_EFFICIENCY };
}

function linkInfo(state, a, b, band, nss = state.settings.nss) {
	const rssi = txPower(state, band) - pathLoss(state, a.x, a.y, b.x, b.y, band);
	return { band, rssi, ...bestRate(state, rssi, band, nss) };
}

/* ------------------------------------------------------------------ *
 * Topology computation
 * ------------------------------------------------------------------ */
function compute(state) {
	const std = STANDARDS[state.settings.std];
	const bhBand = std.bands.includes(state.settings.bhBand) ? state.settings.bhBand : '5';
	const aps = state.nodes.filter((n) => n.type !== 'sta');
	const stas = state.nodes.filter((n) => n.type === 'sta');
	const gw = aps.find((n) => n.type === 'gw');
	const res = { ap: {}, sta: {}, bhBand, channels: {}, cci: [] };
	if (!gw) return res;

	// Backhaul: Dijkstra on airtime cost. On one shared channel, hop throughputs combine as 1 / Σ(1/Ti).
	const cost = new Map(aps.map((a) => [a.id, Infinity]));
	const prev = new Map();
	const hopLink = new Map();
	cost.set(gw.id, 0);
	const done = new Set();
	while (done.size < aps.length) {
		let u = null;
		for (const a of aps) if (!done.has(a.id) && (u === null || cost.get(a.id) < cost.get(u.id))) u = a;
		if (!u || cost.get(u.id) === Infinity) break;
		done.add(u.id);
		for (const v of aps) {
			if (done.has(v.id) || v === u) continue;
			let link;
			if (v.wired) {
				if (u !== gw) continue;
				link = { band: 'eth', tput: WIRED_MBPS, rssi: null };
			} else {
				link = linkInfo(state, u, v, bhBand);
				if (link.tput <= 0) continue;
			}
			const c = cost.get(u.id) + 1 / link.tput;
			if (c < cost.get(v.id)) {
				cost.set(v.id, c);
				prev.set(v.id, u.id);
				hopLink.set(v.id, link);
			}
		}
	}
	for (const a of aps) {
		const c = cost.get(a.id);
		let hops = 0;
		for (let p = a.id; prev.has(p); p = prev.get(p)) hops++;
		res.ap[a.id] = {
			reachable: c < Infinity,
			parent: prev.get(a.id) ?? null,
			link: hopLink.get(a.id) ?? null,
			cost: c,
			bhTput: a === gw ? Infinity : c < Infinity ? 1 / c : 0,
			hops,
			wirelessBh: !!hopLink.get(a.id) && hopLink.get(a.id).band !== 'eth',
			clients: [],
		};
	}

	// Client association
	const live = aps.filter((a) => res.ap[a.id].reachable);
	for (const s of stas) {
		const bands = s.band === 'auto' ? std.bands : std.bands.includes(s.band) ? [s.band] : [];
		const nss = s.nss || state.settings.nss;
		const cands = [];
		for (const a of live) {
			for (const b of bands) {
				const l = linkInfo(state, a, s, b, nss);
				if (l.tput <= 0) continue;
				const r = res.ap[a.id];
				let e2e = l.tput;
				if (a !== gw) e2e = b === bhBand && r.wirelessBh ? 1 / (1 / l.tput + r.cost) : Math.min(l.tput, r.bhTput);
				cands.push({ ap: a, link: l, e2e });
			}
		}
		let pick = null;
		if (cands.length) {
			if (state.settings.steer === 'controller') {
				pick = cands.reduce((x, y) => (y.e2e > x.e2e ? y : x));
			} else {
				// Client picks the AP it hears loudest; the AP then steers it to the highest band above the threshold.
				const ref = (c) => c.link.rssi + (c.link.band === '2.4' ? -7 : 0);
				const loud = cands.reduce((x, y) => (ref(y) > ref(x) ? y : x)).ap;
				const mine = cands.filter((c) => c.ap === loud);
				const ok = mine.filter((c) => c.link.rssi >= state.settings.steerRssi);
				const order = (c) => BANDS.indexOf(c.link.band);
				pick = ok.length ? ok.reduce((x, y) => (order(y) > order(x) ? y : x)) : mine.reduce((x, y) => (y.link.rssi > x.link.rssi ? y : x));
			}
		}
		res.sta[s.id] = pick ? { ap: pick.ap.id, link: pick.link, e2e: pick.e2e, options: cands.length } : null;
		if (pick) res.ap[pick.ap.id].clients.push(s.id);
	}

	// APs linked by wireless backhaul (and the gateway or wired parent they hang from) must share the backhaul channel.
	const rootOf = (a) => { let r = a; while (res.ap[r.id].wirelessBh) r = aps.find((x) => x.id === res.ap[r.id].parent); return r.id; };
	const meshGroups = new Map();
	for (const a of live) if (res.ap[a.id].wirelessBh) {
		const r = rootOf(a);
		if (!meshGroups.has(r)) meshGroups.set(r, [r]);
		meshGroups.get(r).push(a.id);
	}
	const inMesh = (a) => res.ap[a.id].wirelessBh || meshGroups.has(a.id);
	// Channel plan per band: greedy colouring; wireless-backhaul APs inherit their parent's channel on the backhaul band.
	const order = [...live].sort((a, b) => res.ap[a.id].hops - res.ap[b.id].hops);
	for (const b of std.bands) {
		const bw = Math.min(state.settings.bw[b], std.maxBw[b]);
		const list = CHANNELS[b][bw] || CHANNELS[b][20];
		const ch = {};
		for (const a of order) {
			const r = res.ap[a.id];
			if (b === bhBand && r.wirelessBh && ch[r.parent] != null) {
				ch[a.id] = ch[r.parent];
				continue;
			}
			const used = new Map();
			for (const o of order) {
				if (ch[o.id] == null) continue;
				const heard = txPower(state, b) - pathLoss(state, a.x, a.y, o.x, o.y, b);
				if (heard >= CCA_DBM) used.set(ch[o.id], (used.get(ch[o.id]) || 0) + 1);
			}
			ch[a.id] = list.reduce((x, y) => ((used.get(y) || 0) < (used.get(x) || 0) ? y : x), list[0]);
		}
		res.channels[b] = ch;
		if (b === bhBand) res.meshGroups = [...meshGroups.values()].map((members) => ({ band: b, ch: ch[members[0]], members }));
		for (let i = 0; i < order.length; i++)
			for (let j = i + 1; j < order.length; j++) {
				const p = order[i], q = order[j];
				if (ch[p.id] !== ch[q.id]) continue;
				if (b === bhBand && inMesh(p) && inMesh(q) && rootOf(p) === rootOf(q)) continue;
				const heard = txPower(state, b) - pathLoss(state, p.x, p.y, q.x, q.y, b);
				if (heard >= CCA_DBM) res.cci.push({ band: b, a: p.id, b: q.id, ch: ch[p.id] });
			}
	}
	return res;
}

/* ------------------------------------------------------------------ *
 * Presets
 * ------------------------------------------------------------------ */
const DEFAULT_SETTINGS = {
	std: 'wifi7', n: 3.0, nss: 2, steer: 'rssi', steerRssi: -70, bhBand: '5',
	tx: { '2.4': 20, '5': 23, '6': 23 }, bw: { '2.4': 20, '5': 80, '6': 160 },
	heat: 'rssi', heatBand: '5', labels: true,
};
let uid = 1;
const N = (type, x, y, name, extra = {}) => ({ id: 'n' + uid++, type, x, y, name, ...extra });
const Wl = (x1, y1, x2, y2, mat = 'drywall') => ({ id: 'w' + uid++, x1, y1, x2, y2, mat });
const box = (x1, y1, x2, y2, mat) => [Wl(x1, y1, x2, y1, mat), Wl(x2, y1, x2, y2, mat), Wl(x2, y2, x1, y2, mat), Wl(x1, y2, x1, y1, mat)];

const PRESETS = {
	apartment: () => ({
		name: 'Apartment, one router', w: 14, h: 10,
		walls: [...box(0.2, 0.2, 13.8, 9.8, 'concrete'), Wl(6, 0.2, 6, 4), Wl(6, 5.2, 6, 9.8), Wl(6, 6, 13.8, 6), Wl(10, 6, 10, 9.8), Wl(0.2, 5, 3.5, 5), Wl(4.6, 5, 6, 5)],
		nodes: [N('gw', 3, 2.5, 'Router'), N('sta', 9.5, 2.5, 'Laptop'), N('sta', 12, 8.5, 'Phone', { band: 'auto' }), N('sta', 2, 8, 'TV'), N('sta', 8, 8.5, 'Tablet')],
	}),
	house: () => ({
		name: 'House, 3-node wireless mesh', w: 22, h: 14,
		walls: [
			...box(0.3, 0.3, 21.7, 13.7, 'brick'), Wl(8, 0.3, 8, 6), Wl(8, 7.2, 8, 13.7, 'brick'), Wl(15, 0.3, 15, 5.5), Wl(15, 6.7, 15, 13.7),
			Wl(0.3, 7, 3.5, 7), Wl(4.7, 7, 8, 7), Wl(15, 9, 21.7, 9), Wl(11, 9, 11, 13.7), Wl(8, 9, 9.8, 9), Wl(18, 0.3, 18, 4, 'concrete'),
		],
		nodes: [
			N('gw', 4, 3.5, 'Gateway'), N('ap', 11.5, 7.5, 'Hall node'), N('ap', 18.5, 11, 'Bedroom node'),
			N('sta', 2, 11, 'Smart TV'), N('sta', 6, 12.5, 'Phone A'), N('sta', 12, 2, 'Laptop'), N('sta', 13, 12, 'Console'),
			N('sta', 20, 7, 'Phone B'), N('sta', 17, 12.8, 'Tablet'), N('sta', 20.5, 2, 'Camera', { band: '2.4', nss: 1 }),
		],
	}),
	office: () => ({
		name: 'Office, wired backhaul', w: 30, h: 16,
		walls: [
			...box(0.3, 0.3, 29.7, 15.7, 'concrete'), ...box(12.5, 5.5, 17.5, 10.5, 'concrete'),
			Wl(0.3, 5, 9, 5, 'glass'), Wl(9, 0.3, 9, 5, 'glass'), Wl(21, 0.3, 21, 5, 'glass'), Wl(21, 5, 29.7, 5, 'glass'),
			Wl(0.3, 11, 9, 11), Wl(21, 11, 29.7, 11), Wl(9, 11, 9, 15.7), Wl(21, 11, 21, 15.7),
		],
		nodes: [
			N('gw', 15, 13, 'Core router'), N('ap', 5, 8, 'AP West', { wired: true }), N('ap', 25, 8, 'AP East', { wired: true }),
			N('ap', 15, 2.5, 'AP North', { wired: true }), N('ap', 4.5, 13.5, 'AP Meeting', { wired: true }),
			...[[2, 2], [6, 3], [12, 3], [18, 2.5], [24, 2], [27, 3], [3, 8.5], [8, 9], [21, 8.5], [27, 9], [3, 14], [12, 13.5], [19, 14], [26, 14]].map(([x, y], i) => N('sta', x, y, 'Client ' + (i + 1))),
		],
	}),
	chain: () => ({
		name: 'Daisy chain (why hops hurt)', w: 32, h: 8,
		walls: [...box(0.3, 0.3, 31.7, 7.7, 'brick'), Wl(8, 0.3, 8, 7.7, 'brick'), Wl(16, 0.3, 16, 7.7, 'brick'), Wl(24, 0.3, 24, 7.7, 'brick')],
		nodes: [N('gw', 3, 4, 'Gateway'), N('ap', 11, 4, 'Node 1'), N('ap', 19, 4, 'Node 2'), N('ap', 27, 4, 'Node 3'), N('sta', 5, 6.5, 'Near'), N('sta', 13, 6.5, 'Hop 1'), N('sta', 21, 6.5, 'Hop 2'), N('sta', 29, 6.5, 'Hop 3')],
	}),
};

function fromPreset(key) {
	const p = PRESETS[key]();
	for (const n of p.nodes) if (n.type === 'sta' && !n.band) n.band = 'auto';
	return { version: 1, preset: key, w: p.w, h: p.h, walls: p.walls, nodes: p.nodes, settings: structuredClone(DEFAULT_SETTINGS) };
}

/* ------------------------------------------------------------------ *
 * Formatting helpers
 * ------------------------------------------------------------------ */
const fmtMbps = (v) => (!isFinite(v) ? '—' : v >= 1000 ? (v / 1000).toFixed(2) + ' Gb/s' : Math.round(v) + ' Mb/s');
const fmtDbm = (v) => (v == null ? '—' : Math.round(v) + ' dBm');
const bandLabel = (b) => (b === 'eth' ? 'Ethernet' : b + ' GHz');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function tputColor(v) {
	// red → amber → green on a log scale from 10 Mb/s to 1 Gb/s
	const t = Math.max(0, Math.min(1, (Math.log10(Math.max(v, 1)) - 1) / 2));
	const h = 5 + t * 125;
	return `hsl(${h}, 70%, 55%)`;
}
const RSSI_STOPS = [
	[-50, [26, 152, 80]], [-60, [102, 189, 99]], [-67, [166, 217, 106]], [-72, [254, 224, 139]], [-78, [253, 174, 97]], [-84, [244, 109, 67]], [-90, [215, 48, 39]],
];
function rssiRgb(v) {
	if (v >= RSSI_STOPS[0][0]) return RSSI_STOPS[0][1];
	for (let i = 1; i < RSSI_STOPS.length; i++) {
		const [v1, c1] = RSSI_STOPS[i - 1], [v2, c2] = RSSI_STOPS[i];
		if (v >= v2) {
			const t = (v1 - v) / (v1 - v2);
			return c1.map((c, k) => Math.round(c + (c2[k] - c) * t));
		}
	}
	return null;
}
const AP_PALETTE = ['#4c8dff', '#9b7bff', '#22c3a6', '#ff7ab6', '#38bdf8', '#c084fc', '#fb923c', '#a3e635', '#f472b6', '#60a5fa'];
const TH = {
	bg: '#0e131b', grid: 'rgba(255,255,255,0.035)', gridMajor: 'rgba(255,255,255,0.09)', axis: 'rgba(200,210,225,0.45)',
	text: '#c9d2df', textStrong: '#f2f5f9', muted: '#8a95a8', bad: '#ff6b5b', ring: '#0b0e14', select: '#fc3d21', eth: '#aab4c3',
	tagBg: 'rgba(11,14,20,0.72)', pillBg: 'rgba(11,14,20,0.9)',
	sans: 'Inter, system-ui, sans-serif', mono: '"DM Mono", ui-monospace, monospace',
};
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); const ch = [n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.round(f > 0 ? c + (255 - c) * f : c * (1 + f))); return `rgb(${ch.join(',')})`; };

/* ------------------------------------------------------------------ *
 * App
 * ------------------------------------------------------------------ */
export function initTopology(root) {
	const $ = (sel) => root.querySelector(sel);
	const canvas = $('#wt-canvas');
	const ctx = canvas.getContext('2d');
	const treeSvg = $('#wt-tree');
	const STORE = 'wifi-topology-v1';

	let state = load();
	uid = 1 + Math.max(0, ...[...state.nodes, ...state.walls].map((o) => parseInt(String(o.id).slice(1)) || 0));
	let result = compute(state);
	let mode = 'select';
	let selected = null; // { kind: 'node'|'wall', id }
	let hover = null;
	let drag = null;
	let heatCache = null;
	let scale = 40;
	let dpr = 1;

	function load() {
		try {
			if (location.hash.startsWith('#t=')) {
				const s = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(3)))));
				return normalize(s);
			}
			const saved = localStorage.getItem(STORE);
			if (saved) return normalize(JSON.parse(saved));
		} catch (e) {
			console.warn('topology: could not restore saved state', e);
		}
		return fromPreset('house');
	}
	function normalize(s) {
		s.settings = { ...structuredClone(DEFAULT_SETTINGS), ...(s.settings || {}) };
		s.settings.tx = { ...DEFAULT_SETTINGS.tx, ...(s.settings.tx || {}) };
		s.settings.bw = { ...DEFAULT_SETTINGS.bw, ...(s.settings.bw || {}) };
		s.walls = (s.walls || []).filter((w) => MATERIALS[w.mat]);
		s.nodes = (s.nodes || []).filter((n) => ['gw', 'ap', 'sta'].includes(n.type));
		for (const n of s.nodes) if (n.type === 'sta' && !n.band) n.band = 'auto';
		s.w = Math.max(5, Math.min(100, +s.w || 20));
		s.h = Math.max(5, Math.min(100, +s.h || 12));
		return s;
	}
	let saveTimer = 0;
	function save() {
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			try { localStorage.setItem(STORE, JSON.stringify(state)); } catch {}
		}, 300);
	}

	function changed({ heat = true } = {}) {
		result = compute(state);
		if (heat) heatCache = null;
		save();
		draw();
		renderTree();
		renderDetails();
		renderStats();
	}

	/* ---------- geometry ---------- */
	function resize() {
		const wrap = canvas.parentElement;
		const cw = wrap.clientWidth;
		scale = cw / state.w;
		const ch = Math.min(state.h * scale, window.innerHeight * 0.78);
		scale = Math.min(scale, ch / state.h);
		dpr = window.devicePixelRatio || 1;
		canvas.style.width = state.w * scale + 'px';
		canvas.style.height = state.h * scale + 'px';
		canvas.width = Math.round(state.w * scale * dpr);
		canvas.height = Math.round(state.h * scale * dpr);
		heatCache = null;
		draw();
	}
	const toPx = (m) => m * scale;
	function evtPos(e) {
		const r = canvas.getBoundingClientRect();
		return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
	}
	const snap = (v, step = 0.25) => Math.round(v / step) * step;
	const clampX = (x) => Math.max(0.2, Math.min(state.w - 0.2, x));
	const clampY = (y) => Math.max(0.2, Math.min(state.h - 0.2, y));

	function hitNode(p) {
		let best = null, bd = 0.6;
		for (const n of state.nodes) {
			const d = Math.hypot(n.x - p.x, n.y - p.y);
			const r = n.type === 'sta' ? 0.45 : 0.65;
			if (d < Math.max(r, 14 / scale) && d < bd + 0.3) { best = n; bd = d; }
		}
		return best;
	}
	function hitWall(p) {
		let best = null, bd = Math.max(0.25, 8 / scale);
		for (const w of state.walls) {
			const dx = w.x2 - w.x1, dy = w.y2 - w.y1, L2 = dx * dx + dy * dy || 1e-9;
			const t = Math.max(0, Math.min(1, ((p.x - w.x1) * dx + (p.y - w.y1) * dy) / L2));
			const d = Math.hypot(p.x - (w.x1 + t * dx), p.y - (w.y1 + t * dy));
			if (d < bd) { best = w; bd = d; }
		}
		return best;
	}

	/* ---------- heatmap ---------- */
	function buildHeat(coarse) {
		const s = state.settings;
		const std = STANDARDS[s.std];
		const band = std.bands.includes(s.heatBand) ? s.heatBand : '5';
		const cell = coarse ? 0.5 : 0.2;
		const cols = Math.ceil(state.w / cell), rows = Math.ceil(state.h / cell);
		const off = document.createElement('canvas');
		off.width = cols; off.height = rows;
		const octx = off.getContext('2d');
		const img = octx.createImageData(cols, rows);
		const live = state.nodes.filter((n) => n.type !== 'sta' && result.ap[n.id]?.reachable);
		const idx = Object.fromEntries(state.nodes.filter((n) => n.type !== 'sta').map((n, i) => [n.id, i]));
		let covered = 0, total = 0;
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				const x = (c + 0.5) * cell, y = (r + 0.5) * cell;
				let best = -200, bestAp = null;
				for (const a of live) {
					const v = s.tx[band] - pathLoss(state, a.x, a.y, x, y, band);
					if (v > best) { best = v; bestAp = a; }
				}
				total++;
				if (best >= -70) covered++;
				let rgb = null, alpha = 135;
				if (s.heat === 'rssi') rgb = rssiRgb(best);
				else if (s.heat === 'rate') {
					const t = bestRate(state, best, band, s.nss).tput;
					if (t > 0) { const h = 5 + Math.max(0, Math.min(1, (Math.log10(t) - 1) / 2.3)) * 125; rgb = hslToRgb(h / 360, 0.65, 0.5); }
				} else if (s.heat === 'ap' && bestAp && best >= -88) {
					const hex = AP_PALETTE[idx[bestAp.id] % AP_PALETTE.length];
					rgb = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));
					alpha = best >= -70 ? 105 : 45;
				}
				const o = (r * cols + c) * 4;
				if (rgb) { img.data[o] = rgb[0]; img.data[o + 1] = rgb[1]; img.data[o + 2] = rgb[2]; img.data[o + 3] = alpha; }
			}
		}
		octx.putImageData(img, 0, 0);
		return { canvas: off, band, coverage: total ? covered / total : 0, coarse };
	}
	function hslToRgb(h, s, l) {
		const f = (n) => { const k = (n + h * 12) % 12; const a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
		return [f(0), f(8), f(4)];
	}

	/* ---------- drawing ---------- */
	function draw() {
		const s = state.settings;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const W = state.w * scale, H = state.h * scale;
		ctx.clearRect(0, 0, W, H);
		ctx.fillStyle = TH.bg;
		ctx.fillRect(0, 0, W, H);

		if (s.heat !== 'off') {
			const coarse = !!drag;
			if (!heatCache || (heatCache.coarse && !coarse)) heatCache = buildHeat(coarse);
			ctx.imageSmoothingEnabled = true;
			ctx.drawImage(heatCache.canvas, 0, 0, W, H);
		}
		updateScale();
		// grid
		ctx.lineWidth = 1;
		for (let x = 0; x <= state.w; x++) {
			ctx.strokeStyle = x % 5 ? TH.grid : TH.gridMajor;
			ctx.beginPath(); ctx.moveTo(toPx(x) + 0.5, 0); ctx.lineTo(toPx(x) + 0.5, H); ctx.stroke();
		}
		for (let y = 0; y <= state.h; y++) {
			ctx.strokeStyle = y % 5 ? TH.grid : TH.gridMajor;
			ctx.beginPath(); ctx.moveTo(0, toPx(y) + 0.5); ctx.lineTo(W, toPx(y) + 0.5); ctx.stroke();
		}
		ctx.fillStyle = TH.axis;
		ctx.font = `600 10px ${TH.mono}`;
		for (let x = 5; x < state.w; x += 5) ctx.fillText(x + 'm', toPx(x) + 4, H - 6);
		for (let y = 5; y < state.h; y += 5) ctx.fillText(y + 'm', W - 26, toPx(y) - 4);

		// walls
		ctx.lineCap = 'round';
		for (const w of state.walls) {
			const m = MATERIALS[w.mat];
			const sel = selected?.kind === 'wall' && selected.id === w.id;
			if (sel) { ctx.strokeStyle = 'rgba(252,61,33,0.45)'; ctx.lineWidth = m.width + 9; line(w.x1, w.y1, w.x2, w.y2); }
			ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = m.width + 3; line(w.x1, w.y1, w.x2, w.y2);
			ctx.strokeStyle = m.color; ctx.lineWidth = m.width;
			line(w.x1, w.y1, w.x2, w.y2);
		}
		if (drag?.kind === 'newwall') {
			ctx.strokeStyle = MATERIALS[drag.mat].color; ctx.lineWidth = MATERIALS[drag.mat].width; ctx.setLineDash([6, 5]);
			line(drag.x1, drag.y1, drag.x2, drag.y2); ctx.setLineDash([]);
			const len = Math.hypot(drag.x2 - drag.x1, drag.y2 - drag.y1);
			label(`${len.toFixed(2)} m`, (drag.x1 + drag.x2) / 2, (drag.y1 + drag.y2) / 2 - 0.35, TH.text);
		}

		const byId = Object.fromEntries(state.nodes.map((n) => [n.id, n]));
		const pending = [];
		// client links
		for (const n of state.nodes) {
			if (n.type !== 'sta') continue;
			const r = result.sta[n.id];
			if (!r) continue;
			const a = byId[r.ap];
			const focus = isFocus(n.id) || isFocus(a.id);
			ctx.strokeStyle = BAND_COLOR[r.link.band];
			ctx.globalAlpha = focus ? 1 : 0.55;
			ctx.lineWidth = focus ? 2.2 : 1.3;
			ctx.setLineDash([2, 4]);
			line(a.x, a.y, n.x, n.y);
			ctx.setLineDash([]);
			ctx.globalAlpha = 1;
			if (s.labels && focus) pending.push([`${bandLabel(r.link.band)} · ${fmtDbm(r.link.rssi)} · ${fmtMbps(r.e2e)}`, (a.x + n.x) / 2, (a.y + n.y) / 2, BAND_COLOR[r.link.band]]);
		}
		// backhaul links
		for (const n of state.nodes) {
			const r = result.ap[n.id];
			if (!r || !r.parent) continue;
			const p = byId[r.parent];
			if (r.link.band === 'eth') {
				ctx.strokeStyle = TH.eth; ctx.lineWidth = 2.5; ctx.setLineDash([9, 6]);
				line(p.x, p.y, n.x, n.y); ctx.setLineDash([]);
				if (s.labels) pending.push(['Ethernet · 940 Mb/s', (p.x + n.x) / 2, (p.y + n.y) / 2, TH.eth]);
			} else {
				const c = tputColor(r.link.tput);
				ctx.save();
				ctx.shadowColor = c; ctx.shadowBlur = 12;
				ctx.strokeStyle = c; ctx.lineWidth = 4;
				line(p.x, p.y, n.x, n.y);
				ctx.restore();
				if (s.labels) pending.push([`${r.link.band} GHz · ${fmtDbm(r.link.rssi)} · ${fmtMbps(r.link.tput)}`, (p.x + n.x) / 2, (p.y + n.y) / 2, c]);
			}
		}
		for (const args of pending) label(...args);
		// nodes
		const apIdx = Object.fromEntries(state.nodes.filter((n) => n.type !== 'sta').map((n, i) => [n.id, i]));
		for (const n of state.nodes) {
			const sel = selected?.kind === 'node' && selected.id === n.id;
			const hv = hover?.id === n.id;
			const x = toPx(n.x), y = toPx(n.y);
			if (n.type === 'sta') {
				const r = result.sta[n.id];
				const rad = 6.5;
				if (sel || hv) { ring(x, y, rad + 6, sel ? TH.select : 'rgba(255,255,255,0.35)'); }
				ctx.fillStyle = r ? BAND_COLOR[r.link.band] : TH.bg;
				ctx.strokeStyle = r ? TH.ring : TH.bad;
				ctx.lineWidth = 2.5;
				circle(x, y, rad); ctx.fill(); ctx.stroke();
				if (s.labels) nameTag(n.name, x, y + rad + 13, r ? TH.text : TH.bad, 10.5);
			} else {
				const r = result.ap[n.id];
				const color = AP_PALETTE[apIdx[n.id] % AP_PALETTE.length];
				const ok = r?.reachable;
				const rad = n.type === 'gw' ? 15 : 13;
				// halo
				if (ok) {
					const g = ctx.createRadialGradient(x, y, rad * 0.6, x, y, rad * 2.6);
					g.addColorStop(0, hexA(color, 0.45)); g.addColorStop(1, hexA(color, 0));
					ctx.fillStyle = g; circle(x, y, rad * 2.6); ctx.fill();
				}
				if (sel || hv) ring(x, y, rad + 7, sel ? TH.select : 'rgba(255,255,255,0.4)');
				if (ok) {
					const g = ctx.createLinearGradient(x - rad, y - rad, x + rad, y + rad);
					g.addColorStop(0, shade(color, 0.25)); g.addColorStop(1, shade(color, -0.2));
					ctx.fillStyle = g;
				} else ctx.fillStyle = TH.bg;
				ctx.strokeStyle = ok ? TH.ring : TH.bad;
				ctx.lineWidth = 3;
				if (n.type === 'gw') { roundRect(x - rad, y - rad, rad * 2, rad * 2, 6); ctx.fill(); ctx.stroke(); }
				else { circle(x, y, rad); ctx.fill(); ctx.stroke(); }
				// wifi glyph
				const gc = ok ? '#fff' : TH.bad;
				ctx.strokeStyle = gc; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
				for (const k of [4, 7.5]) { ctx.beginPath(); ctx.arc(x, y + 4, k, Math.PI * 1.25, Math.PI * 1.75); ctx.stroke(); }
				ctx.fillStyle = gc; circle(x, y + 4, 1.8); ctx.fill();
				if (n.wired && ok) { ctx.fillStyle = TH.eth; roundRect(x + rad - 6, y - rad - 2, 10, 10, 3); ctx.fill(); ctx.fillStyle = TH.bg; ctx.fillRect(x + rad - 3, y - rad + 1, 4, 4); }
				if (s.labels) {
					const chs = STANDARDS[s.std].bands.map((b) => result.channels[b]?.[n.id]).filter((c) => c != null).join(' / ');
					nameTag(n.name, x, y + rad + 15, TH.textStrong, 11.5, true);
					if (ok) nameTag(`ch ${chs}`, x, y + rad + 30, TH.muted, 9.5, false, true);
					else nameTag('no backhaul', x, y + rad + 30, TH.bad, 9.5, true);
				}
			}
		}
	}
	function updateScale() {
		const s = state.settings, el = $('#wt-scale');
		if (s.heat === 'off' || !heatCache) { el.hidden = true; return; }
		el.hidden = false;
		const band = heatCache.band;
		$('#wt-scale-title').textContent = { rssi: `Signal strength · ${band} GHz`, rate: `Best rate · ${band} GHz`, ap: `Serving AP · ${band} GHz` }[s.heat];
		const bar = el.querySelector('i'), ends = el.querySelector('.wt-scale-ends');
		bar.hidden = ends.hidden = s.heat === 'ap';
		if (s.heat === 'rssi') { bar.style.removeProperty('--grad'); ends.innerHTML = '<b>−50</b><b>−70</b><b>−90 dBm</b>'; }
		if (s.heat === 'rate') { bar.style.setProperty('--grad', 'linear-gradient(90deg, hsl(130,65%,50%), hsl(65,65%,50%), hsl(5,65%,50%))'); ends.innerHTML = '<b>2 Gb/s</b><b>150</b><b>10 Mb/s</b>'; }
	}
	const isFocus = (id) => (selected?.kind === 'node' && selected.id === id) || hover?.id === id;
	function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(toPx(x1), toPx(y1)); ctx.lineTo(toPx(x2), toPx(y2)); ctx.stroke(); }
	function circle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
	function ring(x, y, r, c) { ctx.strokeStyle = c; ctx.lineWidth = 2; circle(x, y, r); ctx.stroke(); }
	function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
	function nameTag(t, x, y, color, size, bold, mono) {
		ctx.font = `${bold ? '700 ' : '600 '}${size}px ${mono ? TH.mono : TH.sans}`;
		const tw = ctx.measureText(t).width;
		ctx.fillStyle = TH.tagBg; roundRect(x - tw / 2 - 4, y - size, tw + 8, size + 5, 4); ctx.fill();
		ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(t, x, y); ctx.textAlign = 'start';
	}
	function label(t, mx, my, color) {
		ctx.font = `600 10.5px ${TH.mono}`;
		const x = toPx(mx), y = toPx(my), tw = ctx.measureText(t).width;
		ctx.fillStyle = TH.pillBg;
		ctx.strokeStyle = hexA(color.startsWith('#') ? color : '#8a95a8', 0.6); ctx.lineWidth = 1;
		roundRect(x - tw / 2 - 7, y - 10, tw + 14, 20, 10); ctx.fill(); ctx.stroke();
		ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(t, x, y + 4); ctx.textAlign = 'start';
	}

	/* ---------- pointer interaction ---------- */
	canvas.addEventListener('pointerdown', (e) => {
		const p = evtPos(e);
		canvas.setPointerCapture(e.pointerId);
		if (mode === 'ap' || mode === 'sta') {
			const n = mode === 'ap'
				? N(state.nodes.some((x) => x.type === 'gw') ? 'ap' : 'gw', snap(p.x), snap(p.y), nextName(mode))
				: N('sta', snap(p.x), snap(p.y), nextName('sta'), { band: 'auto' });
			state.nodes.push(n);
			selected = { kind: 'node', id: n.id };
			changed();
			return;
		}
		if (mode === 'wall') {
			const x = snap(p.x), y = snap(p.y);
			drag = { kind: 'newwall', x1: x, y1: y, x2: x, y2: y, mat: $('#wt-material').value };
			draw();
			return;
		}
		if (mode === 'delete') {
			const n = hitNode(p), w = n ? null : hitWall(p);
			if (n) state.nodes = state.nodes.filter((x) => x !== n);
			else if (w) state.walls = state.walls.filter((x) => x !== w);
			if (n || w) { selected = null; changed(); }
			return;
		}
		const n = hitNode(p);
		if (n) {
			selected = { kind: 'node', id: n.id };
			drag = { kind: 'node', node: n, dx: n.x - p.x, dy: n.y - p.y, moved: false };
		} else {
			const w = hitWall(p);
			selected = w ? { kind: 'wall', id: w.id } : null;
			if (w) drag = { kind: 'wall', wall: w, sx: p.x, sy: p.y, orig: { ...w }, moved: false };
		}
		draw(); renderTree(); renderDetails();
	});
	canvas.addEventListener('pointermove', (e) => {
		const p = evtPos(e);
		if (!drag) {
			const n = hitNode(p);
			const h = n ? { id: n.id } : null;
			if (h?.id !== hover?.id) { hover = h; draw(); }
			canvas.style.cursor = mode === 'select' ? (n || hitWall(p) ? 'grab' : 'default') : mode === 'delete' ? (n || hitWall(p) ? 'not-allowed' : 'default') : 'crosshair';
			showTip(n, e);
			readout(p);
			return;
		}
		if (drag.kind === 'newwall') {
			let x = snap(p.x), y = snap(p.y);
			// lock to horizontal / vertical when close to an axis
			if (Math.abs(x - drag.x1) < 0.4) x = drag.x1;
			if (Math.abs(y - drag.y1) < 0.4) y = drag.y1;
			drag.x2 = Math.max(0, Math.min(state.w, x)); drag.y2 = Math.max(0, Math.min(state.h, y));
			draw();
		} else if (drag.kind === 'node') {
			drag.node.x = clampX(snap(p.x + drag.dx, 0.1));
			drag.node.y = clampY(snap(p.y + drag.dy, 0.1));
			drag.moved = true;
			result = compute(state);
			heatCache = null;
			draw();
			renderDetails();
		} else if (drag.kind === 'wall') {
			const dx = snap(p.x - drag.sx), dy = snap(p.y - drag.sy), o = drag.orig;
			Object.assign(drag.wall, { x1: o.x1 + dx, y1: o.y1 + dy, x2: o.x2 + dx, y2: o.y2 + dy });
			drag.moved = true;
			result = compute(state); heatCache = null; draw();
		}
		hideTip();
	});
	const endDrag = () => {
		if (!drag) return;
		const d = drag;
		drag = null;
		if (d.kind === 'newwall') {
			if (Math.hypot(d.x2 - d.x1, d.y2 - d.y1) >= 0.3) {
				const w = Wl(d.x1, d.y1, d.x2, d.y2, d.mat);
				state.walls.push(w);
				selected = { kind: 'wall', id: w.id };
			}
			changed();
		} else if (d.moved) changed();
		else draw();
	};
	canvas.addEventListener('pointerup', endDrag);
	canvas.addEventListener('pointercancel', endDrag);
	canvas.addEventListener('pointerleave', () => { if (!drag && hover) { hover = null; draw(); } hideTip(); });

	function nextName(kind) {
		const base = kind === 'sta' ? 'Client' : state.nodes.some((x) => x.type === 'gw') ? 'Node' : 'Gateway';
		if (base === 'Gateway') return base;
		let i = 1;
		while (state.nodes.some((n) => n.name === `${base} ${i}`)) i++;
		return `${base} ${i}`;
	}

	window.addEventListener('keydown', (e) => {
		if (e.target.closest('input, select, textarea')) return;
		if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
			if (selected.kind === 'node') state.nodes = state.nodes.filter((n) => n.id !== selected.id);
			else state.walls = state.walls.filter((w) => w.id !== selected.id);
			selected = null; changed(); e.preventDefault();
		} else if (e.key === 'Escape') { selected = null; setMode('select'); draw(); renderTree(); renderDetails(); }
		else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
			const k = { v: 'select', a: 'ap', c: 'sta', w: 'wall', d: 'delete' }[e.key.toLowerCase()];
			if (k) setMode(k);
		}
	});

	/* ---------- cursor readout ---------- */
	const statusEl = $('#wt-status');
	function readout(p) {
		const s = state.settings;
		const band = STANDARDS[s.std].bands.includes(s.heatBand) ? s.heatBand : '5';
		let best = -200, bestAp = null;
		for (const a of state.nodes) {
			if (a.type === 'sta' || !result.ap[a.id]?.reachable) continue;
			const v = s.tx[band] - pathLoss(state, a.x, a.y, p.x, p.y, band);
			if (v > best) { best = v; bestAp = a; }
		}
		const pos = `x ${p.x.toFixed(1)} m  y ${p.y.toFixed(1)} m`;
		if (!bestAp) { statusEl.textContent = pos; return; }
		const r = bestRate(state, best, band, s.nss);
		statusEl.textContent = `${pos}  ·  ${band} GHz ${Math.round(best)} dBm from ${bestAp.name}  ·  ${r.tput > 0 ? `MCS ${r.mcs} @ ${r.bw} MHz ≈ ${fmtMbps(r.tput)}` : 'no link'}`;
	}
	canvas.addEventListener('pointerleave', () => { statusEl.textContent = ''; });

	/* ---------- tooltip ---------- */
	const tip = $('#wt-tip');
	function showTip(n, e) {
		if (!n) return hideTip();
		tip.innerHTML = nodeSummary(n, true);
		tip.hidden = false;
		const r = root.querySelector('.wt-canvas-wrap').getBoundingClientRect();
		let x = e.clientX - r.left + 14, y = e.clientY - r.top + 14;
		if (x + 260 > r.width) x -= 280;
		tip.style.left = x + 'px'; tip.style.top = y + 'px';
	}
	function hideTip() { tip.hidden = true; }

	function nodeSummary(n, short = false) {
		const byId = Object.fromEntries(state.nodes.map((x) => [x.id, x]));
		if (n.type === 'sta') {
			const r = result.sta[n.id];
			if (!r) return `<b>${esc(n.name)}</b><br><span class="wt-bad">Not connected: no AP heard well enough${n.band !== 'auto' ? ` on ${n.band} GHz` : ''}.</span>`;
			const ap = byId[r.ap], l = r.link;
			return `<b>${esc(n.name)}</b> → ${esc(ap.name)}<br>
				${bandLabel(l.band)} · ${l.bw} MHz · MCS ${l.mcs} · ${n.nss || state.settings.nss}×${n.nss || state.settings.nss}<br>
				RSSI ${fmtDbm(l.rssi)} · SNR ${Math.round(l.snr)} dB<br>
				Link ${fmtMbps(l.tput)} · <b>end-to-end ${fmtMbps(r.e2e)}</b>${short ? '' : `<br>Path: ${pathToGw(ap).map((x) => esc(x.name)).join(' → ')}`}`;
		}
		const r = result.ap[n.id];
		if (!r) return esc(n.name);
		if (!r.reachable) return `<b>${esc(n.name)}</b><br><span class="wt-bad">No backhaul: too far from every other node on ${result.bhBand} GHz. Move it closer or mark it wired.</span>`;
		const chs = STANDARDS[state.settings.std].bands.map((b) => `${b}: ${result.channels[b]?.[n.id] ?? '—'}`).join(' · ');
		let s = `<b>${esc(n.name)}</b> (${n.type === 'gw' ? 'gateway / controller' : 'mesh agent'})<br>`;
		if (n.type !== 'gw') {
			const l = r.link;
			s += l.band === 'eth' ? 'Backhaul: Ethernet to gateway<br>' : `Backhaul: ${bandLabel(l.band)} to ${esc(byId[r.parent].name)} · ${fmtDbm(l.rssi)} · MCS ${l.mcs} @ ${l.bw} MHz<br>Hop ${fmtMbps(l.tput)} · <b>to gateway ${fmtMbps(r.bhTput)}</b> (${r.hops} hop${r.hops > 1 ? 's' : ''})<br>`;
		}
		s += `${r.clients.length} client${r.clients.length === 1 ? '' : 's'} · channels ${chs}`;
		return s;
	}
	function pathToGw(n) {
		const byId = Object.fromEntries(state.nodes.map((x) => [x.id, x]));
		const out = [n];
		let p = result.ap[n.id]?.parent;
		while (p) { out.push(byId[p]); p = result.ap[p]?.parent; }
		return out;
	}

	/* ---------- logical tree ---------- */
	function renderTree() {
		const byId = Object.fromEntries(state.nodes.map((n) => [n.id, n]));
		const gw = state.nodes.find((n) => n.type === 'gw');
		if (!gw) { treeSvg.innerHTML = '<text x="20" y="40" class="wt-t-muted">Add a gateway to start (A, then click the floor).</text>'; treeSvg.setAttribute('viewBox', '0 0 600 80'); return; }
		const kids = (id) => [
			...state.nodes.filter((n) => n.type === 'ap' && result.ap[n.id]?.parent === id),
			...state.nodes.filter((n) => n.type === 'sta' && result.sta[n.id]?.ap === id),
		];
		const LW = 118, LH = 104;
		const pos = {};
		let leaf = 0, maxDepth = 0;
		const place = (n, depth) => {
			maxDepth = Math.max(maxDepth, depth);
			const ch = n.type === 'sta' ? [] : kids(n.id);
			if (!ch.length) { pos[n.id] = { x: leaf++ * LW + LW / 2, y: depth * LH + 40 }; return; }
			ch.forEach((c) => place(c, depth + 1));
			const xs = ch.map((c) => pos[c.id].x);
			pos[n.id] = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: depth * LH + 40 };
		};
		place(gw, 0);
		const orphans = state.nodes.filter((n) => !pos[n.id]);
		const width = Math.max(leaf, orphans.length, 4) * LW;
		const oy = (maxDepth + 1) * LH + 50;
		orphans.forEach((n, i) => (pos[n.id] = { x: i * LW + LW / 2, y: oy + 20 }));
		const height = (orphans.length ? oy + 70 : (maxDepth + 1) * LH + 30);
		let svg = '';
		for (const n of state.nodes) {
			if (orphans.includes(n) || n === gw) continue;
			const parentId = n.type === 'sta' ? result.sta[n.id].ap : result.ap[n.id].parent;
			const a = pos[parentId], b = pos[n.id];
			const link = n.type === 'sta' ? result.sta[n.id].link : result.ap[n.id].link;
			const color = link.band === 'eth' ? TH.eth : n.type === 'sta' ? BAND_COLOR[link.band] : tputColor(link.tput);
			const dash = link.band === 'eth' ? '8 5' : n.type === 'sta' ? '3 4' : '';
			const my = (a.y + b.y) / 2;
			svg += `<path d="M${a.x},${a.y + 38} C${a.x},${my + 10} ${b.x},${my} ${b.x},${b.y - 14}" fill="none" stroke="${color}" stroke-width="${n.type === 'sta' ? 1.6 : 3.5}" stroke-dasharray="${dash}"/>`;
			const mbps = n.type === 'sta' ? result.sta[n.id].e2e : result.ap[n.id].bhTput;
			svg += `<text x="${b.x}" y="${b.y - 22}" text-anchor="middle" class="wt-t-link" fill="${color}">${link.band === 'eth' ? 'eth' : link.band + 'G'} · ${fmtMbps(mbps)}</text>`;
		}
		const apIdx = Object.fromEntries(state.nodes.filter((n) => n.type !== 'sta').map((n, i) => [n.id, i]));
		for (const n of state.nodes) {
			const p = pos[n.id];
			const sel = selected?.kind === 'node' && selected.id === n.id;
			const orphan = orphans.includes(n);
			const attrs = `data-id="${n.id}" class="wt-t-node${sel ? ' sel' : ''}"`;
			if (n.type === 'sta') {
				const r = result.sta[n.id];
				svg += `<g ${attrs}><circle cx="${p.x}" cy="${p.y}" r="9" fill="${r ? BAND_COLOR[r.link.band] : TH.bg}" stroke="${r ? '#11161f' : TH.bad}" stroke-width="2.5"/>`;
			} else {
				const c = orphan ? TH.bg : AP_PALETTE[apIdx[n.id] % AP_PALETTE.length];
				svg += `<g ${attrs}>` + (n.type === 'gw'
					? `<rect x="${p.x - 16}" y="${p.y - 16}" width="32" height="32" rx="6" fill="${c}" stroke="${orphan ? TH.bad : '#11161f'}" stroke-width="3"/>`
					: `<circle cx="${p.x}" cy="${p.y}" r="15" fill="${c}" stroke="${orphan ? TH.bad : '#11161f'}" stroke-width="3"/>`);
			}
			svg += `<text x="${p.x}" y="${p.y + (n.type === 'sta' ? 24 : 32)}" text-anchor="middle" class="wt-t-name">${esc(n.name.length > 16 ? n.name.slice(0, 15) + '…' : n.name)}</text></g>`;
		}
		if (orphans.length) svg += `<text x="8" y="${oy - 14}" class="wt-t-muted">Not connected</text><line x1="0" y1="${oy - 30}" x2="${width}" y2="${oy - 30}" stroke="#232b38"/>`;
		treeSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
		treeSvg.setAttribute('width', width);
		treeSvg.setAttribute('height', height);
		treeSvg.innerHTML = svg;
	}
	treeSvg.addEventListener('click', (e) => {
		const g = e.target.closest('[data-id]');
		selected = g ? { kind: 'node', id: g.dataset.id } : null;
		draw(); renderTree(); renderDetails();
	});

	/* ---------- details & stats ---------- */
	const details = $('#wt-details');
	const kv = (rows) => `<dl>${rows.filter(Boolean).map(([k, v, hl]) => `<dt>${k}</dt><dd${hl ? ' class="hl"' : ''}>${v}</dd>`).join('')}</dl>`;
	function renderDetails() {
		if (!selected) {
			details.innerHTML = `<div class="empty"><b>Nothing selected</b>Click a node or wall on the floor plan, or a node in the topology tree. Hover a node for a quick summary.</div>`;
			return;
		}
		const byId = Object.fromEntries(state.nodes.map((x) => [x.id, x]));
		if (selected.kind === 'wall') {
			const w = state.walls.find((x) => x.id === selected.id);
			if (!w) { selected = null; return renderDetails(); }
			const m = MATERIALS[w.mat];
			const len = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
			details.innerHTML = `<div class="insp-head"><span class="insp-avatar" style="background:${m.color};color:#0b0e14">▮</span><div><div class="insp-title">Wall</div><span class="chip">${len.toFixed(2)} m</span></div></div>
				${kv([['Loss 2.4 GHz', m.loss[0] + ' dB'], ['Loss 5 GHz', m.loss[1] + ' dB'], ['Loss 6 GHz', m.loss[2] + ' dB']])}
				<label class="wt-field"><span>Material</span><select data-f="mat">${Object.entries(MATERIALS).map(([k, mm]) => `<option value="${k}" ${k === w.mat ? 'selected' : ''}>${mm.name}</option>`).join('')}</select></label>
				<button type="button" data-act="del" class="danger">Delete wall</button>`;
			return;
		}
		const n = state.nodes.find((x) => x.id === selected.id);
		if (!n) { selected = null; return renderDetails(); }
		const std = STANDARDS[state.settings.std];
		const apIdx = Object.fromEntries(state.nodes.filter((x) => x.type !== 'sta').map((x, i) => [x.id, i]));
		let head, rows = [], path = '';
		if (n.type === 'sta') {
			const r = result.sta[n.id];
			head = { av: '◉', bg: r ? BAND_COLOR[r.link.band] : '#3a4454', role: 'Client', chip: r ? ['ok', `${bandLabel(r.link.band)} · connected`] : ['bad', 'not connected'] };
			if (r) {
				const l = r.link, ap = byId[r.ap];
				rows = [['Access point', esc(ap.name)], ['Channel', `${l.bw} MHz · ch ${result.channels[l.band]?.[ap.id] ?? '—'}`], ['RSSI', fmtDbm(l.rssi)], ['SNR', Math.round(l.snr) + ' dB'],
					['MCS', `${l.mcs} · ${n.nss || state.settings.nss}×${n.nss || state.settings.nss}`], ['Link rate', fmtMbps(l.tput)], ['End-to-end', fmtMbps(r.e2e), true]];
				path = 'Path: ' + [n, ...pathToGw(ap)].map((x) => esc(x.name)).join(' → ');
			} else rows = [['Reason', `No AP heard above sensitivity${n.band !== 'auto' ? ` on ${n.band} GHz` : ''}`]];
		} else {
			const r = result.ap[n.id];
			const color = AP_PALETTE[apIdx[n.id] % AP_PALETTE.length];
			head = { av: n.type === 'gw' ? 'GW' : 'AP', bg: r?.reachable ? color : '#3a4454', role: n.type === 'gw' ? 'Gateway · controller' : 'Mesh agent', chip: r?.reachable ? ['ok', n.type === 'gw' ? 'root' : n.wired ? 'wired backhaul' : `${r.hops} wireless hop${r.hops > 1 ? 's' : ''}`] : ['bad', 'no backhaul'] };
			if (r?.reachable) {
				if (n.type !== 'gw') {
					const l = r.link;
					rows.push(l.band === 'eth' ? ['Backhaul', 'Ethernet · 940 Mb/s'] : ['Backhaul', `${l.band} GHz → ${esc(byId[r.parent].name)}`]);
					if (l.band !== 'eth') rows.push(['Backhaul RSSI', fmtDbm(l.rssi)], ['Hop rate', `${fmtMbps(l.tput)} · MCS ${l.mcs} @ ${l.bw}`]);
					rows.push(['To gateway', fmtMbps(r.bhTput), true]);
				}
				rows.push(['Clients', String(r.clients.length)]);
				for (const b of std.bands) rows.push([`Channel ${b} GHz`, String(result.channels[b]?.[n.id] ?? '—')]);
				if (n.type !== 'gw') path = 'Path: ' + pathToGw(n).map((x) => esc(x.name)).join(' → ');
			} else rows = [['Reason', `Too far from every node on ${result.bhBand} GHz. Move it closer or mark it wired.`]];
		}
		let f = `<label class="wt-field"><span>Name</span><input class="wt-input" data-f="name" value="${esc(n.name)}" maxlength="40"></label>`;
		if (n.type === 'gw' || n.type === 'ap') f += `<label class="wt-field"><span>Role</span><select data-f="type"><option value="gw" ${n.type === 'gw' ? 'selected' : ''}>Gateway / controller</option><option value="ap" ${n.type === 'ap' ? 'selected' : ''}>Mesh agent</option></select></label>`;
		if (n.type === 'ap') f += `<label class="wt-check"><input type="checkbox" data-f="wired" ${n.wired ? 'checked' : ''}> Wired backhaul (Ethernet)</label>`;
		if (n.type === 'sta') {
			f += `<label class="wt-field"><span>Band</span><select data-f="band"><option value="auto">Auto (steered)</option>${std.bands.map((b) => `<option value="${b}" ${n.band === b ? 'selected' : ''}>${b} GHz only</option>`).join('')}</select></label>`;
			f += `<label class="wt-field"><span>Spatial streams</span><select data-f="nss"><option value="">Default (${state.settings.nss}×${state.settings.nss})</option>${[1, 2, 3, 4].map((k) => `<option value="${k}" ${n.nss === k ? 'selected' : ''}>${k}×${k}</option>`).join('')}</select></label>`;
		}
		details.innerHTML = `<div class="insp-head"><span class="insp-avatar" style="background:${head.bg}">${head.av}</span><div><div class="insp-title">${esc(n.name)}</div><span class="chip">${head.role}</span> <span class="chip ${head.chip[0]}">${head.chip[1]}</span></div></div>
			${kv(rows)}${path ? `<p class="path">${path}</p>` : ''}${f}<button type="button" data-act="del" class="danger">Delete ${n.type === 'sta' ? 'client' : 'node'}</button>`;
	}

	details.addEventListener('input', (e) => {
		const el = e.target, f = el.dataset.f;
		if (!f || !selected) return;
		if (selected.kind === 'wall') {
			const w = state.walls.find((x) => x.id === selected.id);
			w[f] = el.value;
			changed();
			return;
		}
		const n = state.nodes.find((x) => x.id === selected.id);
		if (f === 'name') { n.name = el.value || 'Unnamed'; save(); draw(); renderTree(); details.querySelector('.insp-title').textContent = n.name; return; }
		if (f === 'wired') n.wired = el.checked;
		else if (f === 'nss') n.nss = el.value ? +el.value : undefined;
		else if (f === 'type') {
			if (el.value === 'gw') { for (const o of state.nodes) if (o.type === 'gw') o.type = 'ap'; n.type = 'gw'; n.wired = false; }
			else n.type = 'ap';
		} else n[f] = el.value;
		changed();
	});
	details.addEventListener('click', (e) => {
		if (e.target.dataset.act !== 'del' || !selected) return;
		if (selected.kind === 'node') state.nodes = state.nodes.filter((n) => n.id !== selected.id);
		else state.walls = state.walls.filter((w) => w.id !== selected.id);
		selected = null; changed();
	});

	const stats = $('#wt-stats');
	function renderStats() {
		const stas = state.nodes.filter((n) => n.type === 'sta');
		const aps = state.nodes.filter((n) => n.type !== 'sta');
		const byId = Object.fromEntries(state.nodes.map((n) => [n.id, n]));
		const conn = stas.filter((s) => result.sta[s.id]);
		const t = conn.map((s) => ({ s, v: result.sta[s.id].e2e })).sort((a, b) => a.v - b.v);
		const median = t.length ? t[Math.floor(t.length / 2)].v : 0;
		const isolated = aps.filter((a) => !result.ap[a.id]?.reachable).length;
		const wired = aps.filter((a) => a.type === 'ap' && a.wired).length;
		const band = { '2.4': 0, '5': 0, '6': 0 };
		for (const s of conn) band[result.sta[s.id].link.band]++;
		if (state.settings.heat !== 'off' && !heatCache) heatCache = buildHeat(false);
		const cov = heatCache && state.settings.heat !== 'off' ? heatCache.coverage : null;
		const tone = (v, good, ok) => (v >= good ? 'tone-ok' : v >= ok ? 'tone-warn' : 'tone-bad');
		const split = (v) => { const f = fmtMbps(v).split(' '); return `${f[0]}<small>${f[1] || ''}</small>`; };
		const pct = stas.length ? conn.length / stas.length : 1;
		const kpi = (label, value, sub, cls = '') => `<div class="kpi"><span class="kpi-label">${label}</span><b class="kpi-value ${cls}">${value}</b><span class="kpi-sub">${sub}</span></div>`;
		stats.innerHTML = [
			kpi('Clients online', `${conn.length}<small>/ ${stas.length}</small>`, stas.length ? `${Math.round(pct * 100)} % associated` : 'add clients with C', stas.length ? tone(pct, 1, 0.8) : ''),
			kpi('Median throughput', t.length ? split(median) : '—', 'end-to-end, per client', t.length ? tone(median, 300, 80) : ''),
			kpi('Slowest client', t.length ? split(t[0].v) : '—', t.length ? esc(t[0].s.name) : '—', t.length ? tone(t[0].v, 150, 40) : ''),
			kpi(`Coverage ≥ −70 dBm`, cov == null ? '—' : `${Math.round(cov * 100)}<small>%</small>`, cov == null ? 'turn on a heatmap' : `of floor area at ${heatCache.band} GHz`, cov == null ? '' : tone(cov, 0.95, 0.8)),
			kpi('Access points', `${aps.length}`, aps.length ? `${wired} wired · ${aps.length - 1 - wired - Math.max(0, isolated)} wireless${isolated ? ` · <span class="tone-bad">${isolated} isolated</span>` : ''}` : 'add one with A'),
			`<div class="kpi"><span class="kpi-label">Band mix</span><div class="kpi-bar">${conn.length ? ['2.4', '5', '6'].map((b) => `<i style="width:${(band[b] / conn.length) * 100}%;background:${BAND_COLOR[b]}"></i>`).join('') : ''}</div><span class="kpi-sub">${['2.4', '5', '6'].filter((b) => band[b]).map((b) => `<span style="color:${BAND_COLOR[b]}">${b}G ${band[b]}</span>`).join(' · ') || 'no clients'}</span></div>`,
		].join('');

		const items = [];
		const add = (sev, tag, html) => items.push(`<li class="sev-${sev}"><span class="tag">${tag}</span><div>${html}</div></li>`);
		if (!aps.some((a) => a.type === 'gw')) add('bad', 'Setup', 'There is no gateway. Choose <b>Access point</b> and click the floor: the first AP becomes the gateway.');
		for (const a of aps.filter((x) => !result.ap[x.id]?.reachable)) add('bad', 'Backhaul', `<b>${esc(a.name)}</b> cannot reach the gateway on ${result.bhBand} GHz. Move it closer or mark it wired.`);
		for (const s of stas.filter((x) => !result.sta[x.id])) add('bad', 'Coverage', `<b>${esc(s.name)}</b> is out of range of every AP.`);
		for (const g of result.meshGroups || []) add('info', 'Mesh', `<b>${g.members.map((id) => esc(byId[id].name)).join(', ')}</b> share ${g.band} GHz channel ${g.ch}: wireless backhaul links must use one channel, so ${g.band} GHz clients on these nodes share airtime with the backhaul.`);
		for (const c of result.cci) add('warn', 'Co-channel', `<b>${esc(byId[c.a].name)}</b> and <b>${esc(byId[c.b].name)}</b> are both on ${c.band} GHz channel ${c.ch} and hear each other above ${CCA_DBM} dBm, so they split airtime.`);
		const deep = aps.filter((a) => result.ap[a.id]?.hops >= 3 && result.ap[a.id].wirelessBh);
		if (deep.length) add('warn', 'Hops', `${deep.map((a) => `<b>${esc(a.name)}</b>`).join(', ')}: three or more wireless hops. Each hop on the same channel adds airtime, so throughput falls fast.`);
		const weak = stas.filter((n) => result.sta[n.id] && result.sta[n.id].link.rssi < -75);
		if (weak.length) add('warn', 'Signal', `Weak clients below −75 dBm: ${weak.map((n) => `<b>${esc(n.name)}</b>`).join(', ')}.`);
		if (!items.length) add('ok', 'Healthy', 'No problems found. Every client is associated and no channels collide.');
		$('#wt-warnings').innerHTML = items.join('');
	}

	/* ---------- toolbar & settings ---------- */
	function setMode(m) {
		mode = m;
		root.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
		$('#wt-material-wrap').hidden = m !== 'wall';
		canvas.style.cursor = m === 'select' ? 'default' : 'crosshair';
		$('#wt-hint').textContent = {
			select: 'Drag nodes or walls to move them. Click to select.',
			ap: 'Click the floor to place an access point. The first one becomes the gateway.',
			sta: 'Click the floor to place a client device.',
			wall: 'Press and drag to draw a wall. It snaps to 25 cm and locks to horizontal or vertical.',
			delete: 'Click a node or wall to delete it.',
		}[m];
	}
	root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

	const bindings = [
		['#wt-std', 'std'], ['#wt-heat', 'heat'], ['#wt-heatband', 'heatBand'], ['#wt-bh', 'bhBand'], ['#wt-steer', 'steer'],
		['#wt-n', 'n', Number], ['#wt-nss', 'nss', Number], ['#wt-steerrssi', 'steerRssi', Number],
		['#wt-tx24', 'tx.2.4', Number], ['#wt-tx5', 'tx.5', Number], ['#wt-tx6', 'tx.6', Number],
		['#wt-bw24', 'bw.2.4', Number], ['#wt-bw5', 'bw.5', Number], ['#wt-bw6', 'bw.6', Number],
		['#wt-labels', 'labels', 'bool'],
	];
	const getPath = (k) => { const [a, ...b] = k.split('.'); return b.length ? state.settings[a][b.join('.')] : state.settings[a]; };
	const setPath = (k, v) => { const [a, ...b] = k.split('.'); if (b.length) state.settings[a][b.join('.')] = v; else state.settings[a] = v; };
	function syncControls() {
		const std = STANDARDS[state.settings.std];
		for (const [sel, key, cast] of bindings) {
			const el = $(sel);
			if (cast === 'bool') el.checked = !!getPath(key);
			else el.value = String(getPath(key));
		}
		// options that depend on the standard
		for (const sel of ['#wt-heatband', '#wt-bh']) $(sel).querySelectorAll('option[value="6"]').forEach((o) => (o.disabled = !std.bands.includes('6')));
		$('#wt-bw6').querySelectorAll('option').forEach((o) => (o.disabled = +o.value > std.maxBw['6']));
		root.querySelectorAll('.wt-6g').forEach((el) => el.classList.toggle('wt-off', !std.bands.includes('6')));
		$('#wt-n-out').textContent = (+state.settings.n).toFixed(1);
		$('#wt-steerrssi-out').textContent = state.settings.steerRssi + ' dBm';
		$('#wt-steerrssi-wrap').hidden = state.settings.steer !== 'rssi';
		$('#wt-w').value = state.w; $('#wt-h').value = state.h;
	}
	for (const [sel, key, cast] of bindings) {
		$(sel).addEventListener('input', (e) => {
			const el = e.target;
			const v = cast === 'bool' ? el.checked : cast ? cast(el.value) : el.value;
			setPath(key, v);
			if (key === 'std') {
				const std = STANDARDS[v];
				if (!std.bands.includes(state.settings.bhBand)) state.settings.bhBand = '5';
				if (!std.bands.includes(state.settings.heatBand)) state.settings.heatBand = '5';
				if (state.settings.bw['6'] > std.maxBw['6']) state.settings.bw['6'] = std.maxBw['6'] || 160;
			}
			syncControls();
			changed({ heat: key !== 'labels' && key !== 'steer' && key !== 'steerRssi' });
		});
	}
	const sizeChange = () => {
		state.w = Math.max(5, Math.min(100, +$('#wt-w').value || state.w));
		state.h = Math.max(5, Math.min(100, +$('#wt-h').value || state.h));
		for (const n of state.nodes) { n.x = clampX(n.x); n.y = clampY(n.y); }
		resize(); changed();
	};
	$('#wt-w').addEventListener('change', sizeChange);
	$('#wt-h').addEventListener('change', sizeChange);

	$('#wt-preset').addEventListener('change', (e) => {
		if (!e.target.value) return;
		if (state.nodes.length && !confirm('Replace the current layout with this preset?')) { e.target.value = ''; return; }
		const keep = state.settings;
		state = fromPreset(e.target.value);
		state.settings = keep;
		e.target.value = '';
		selected = null; syncControls(); resize(); changed();
	});
	$('#wt-clear').addEventListener('click', () => {
		if (!confirm('Remove all nodes and walls?')) return;
		state.nodes = []; state.walls = []; selected = null; changed();
	});
	$('#wt-export').addEventListener('click', () => {
		const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob); a.download = 'wifi-topology.json'; a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
	});
	$('#wt-png').addEventListener('click', () => {
		const a = document.createElement('a');
		a.href = canvas.toDataURL('image/png'); a.download = 'wifi-topology.png'; a.click();
	});
	$('#wt-import').addEventListener('change', async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		try {
			state = normalize(JSON.parse(await file.text()));
			uid = 1 + Math.max(0, ...[...state.nodes, ...state.walls].map((o) => parseInt(String(o.id).slice(1)) || 0));
			selected = null; syncControls(); resize(); changed();
		} catch { alert('That file is not a valid topology JSON.'); }
		e.target.value = '';
	});
	$('#wt-share').addEventListener('click', async () => {
		const hash = '#t=' + btoa(unescape(encodeURIComponent(JSON.stringify(state))));
		const url = location.origin + location.pathname + hash;
		history.replaceState(null, '', hash);
		const btn = $('#wt-share');
		try { await navigator.clipboard.writeText(url); btn.textContent = 'Link copied'; }
		catch { btn.textContent = 'Link in address bar'; }
		setTimeout(() => (btn.textContent = 'Share link'), 1800);
	});

	root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
		root.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('active', x === b));
		root.querySelectorAll('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tab));
	}));
	new ResizeObserver(() => resize()).observe(canvas.parentElement);
	setMode('select');
	syncControls();
	resize();
	changed({ heat: false });
}
