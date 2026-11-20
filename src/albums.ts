// Travel photo albums shown on /photos.
// Each key is a folder name under src/assets/traveling/; every image in that
// folder is picked up automatically. Folders without an entry here still show
// up, titled after the folder name.

export interface Album {
	title: string;
	location?: string;
	date?: string; // e.g. 'Dec 2025'; albums are listed newest first by this
	description?: string;
	post?: string; // blog post id, links the album to its story
	cover?: string; // file name inside the folder; defaults to the first image
	coords?: [number, number]; // [latitude, longitude] of the pin on the globe (approximate is fine)
	captions?: Record<string, string>; // optional per-photo captions, keyed by file name
}

export const ALBUMS: Record<string, Album> = {
	'MuCangChai-YenBai': {
		title: 'Golden Terraces of Mu Cang Chai',
		location: 'Mu Cang Chai, Yen Bai · Vietnam',
		date: 'Sep 2026',
		description:
			'Rice terraces ripening into gold, afternoon light over the valleys, and morning mist rolling between the mountains.',
		cover: 'IMG_8664.JPG',
		coords: [21.85, 104.08],
	},
	'Samu-SonLa': {
		title: 'Cloudy Sky on Samu Peak',
		location: 'Bac Yen, Son La · Vietnam',
		date: 'Dec 2025',
		description:
			'A solo trek through the mossy forests of Ta Xua to the 2756 m summit of Samu, above a sea of clouds.',
		post: 'samu-trecking',
		cover: 'about.jpg',
		coords: [21.33, 104.42],
	},
	DaNang: {
		title: 'Da Nang & Hoi An by the Sea',
		location: 'Da Nang & Quang Nam · Vietnam',
		date: 'Jul 2026',
		description:
			'The bay seen from the rocks of Son Tra, lantern light on the river in Hoi An, basket boats in the coconut forest and quiet mornings on the beach.',
		cover: 'IMG_1984.jpg',
		coords: [16.0, 108.25],
		captions: {
			'IMG_1961.jpg': 'Da Nang across the bay from the rocks of Son Tra',
			'IMG_1962.jpg': 'Blue sky over the bay, framed by the trees of Son Tra',
			'IMG_1977.jpg': 'Hoi An at night, lanterns reflected in the river',
			'IMG_1979.jpg': 'Sunrise over the rooftops and the sea',
			'IMG_1982.jpg': 'Basket boats spread across the water by the coconut forest',
			'IMG_1984.jpg': 'Basket boats in the coconut forest',
			'IMG_1997.jpg': 'Palm trees and thatched umbrellas on the beach',
			'IMG_2001.jpg': 'An empty beach under a grey morning sky',
		},
	},
	Hue: {
		title: 'The Old Capital of Hue',
		location: 'Hue · Vietnam',
		date: 'Jan 2026',
		description:
			'Truong Tien Bridge glowing over the Perfume River at night, and a cloudy morning walk to the Flag Tower and the Ngo Mon Gate of the Imperial City.',
		cover: 'IMG_1366.jpg',
		coords: [16.47, 107.58],
		captions: {
			'IMG_1366.jpg': 'Truong Tien Bridge lit red over the Perfume River',
			'IMG_1367.jpg': 'City lights along the Perfume River',
			'IMG_1373.jpg': 'Truong Tien Bridge from the riverbank',
			'IMG_1378.jpg': 'The Flag Tower of the Hue Citadel',
			'IMG_1381.jpg': 'Ngo Mon Gate, the entrance to the Imperial City',
		},
	},
	// Folders below have no custom text yet: the title comes from the folder name and the
	// date comes from the photos' EXIF. Add title / description / captions here to tell the story.
	'CatBa-HaiPhong': { title: 'Cat Ba', coords: [20.8, 107.05] },
	'LaoThan-LaoCai': { title: 'Lao Than', coords: [22.63, 103.63] },
	'TamDao-VinhPhuc': { title: 'Tam Dao', coords: [21.46, 105.64] },
	'VuonVua-PhuTho': { title: 'Vuon Vua', coords: [21.17, 105.2] },
};
