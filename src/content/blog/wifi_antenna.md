---
title: 'Wi-Fi Antenna Circuits: How They Work and Two You Can Build'
description: 'What sits between a Wi-Fi chip and the air: the balun, front-end module, filter, matching network and antenna. Covers wavelengths at 2.4, 5 and 6 GHz, 50 Ω, VSWR and return loss, a worked L-match, PCB inverted-F antennas, connectors and coax loss. Then two builds: a quarter-wave ground-plane antenna on an SMA connector and an 11 dBi biquad, plus designing for the 6 GHz band of Wi-Fi 6E and Wi-Fi 7, with tuning, testing and legal limits.'
pubDate: 'Nov 24 2026'
heroImage: '../../assets/hero/wifi_antenna.jpg'
category: 'Circuit'
---

### Overview

---

Every Wi-Fi device has a small analogue circuit hiding next to its digital chip. It takes the radio signal out of the silicon, makes it strong enough to send, protects the receiver, cleans up the spectrum and hands it to a piece of copper shaped to launch it into the air. That piece of copper is the antenna, and at Wi-Fi frequencies its size, its shape and even the board around it are part of the circuit.

This post covers:

1. **The antenna circuit:** the blocks between the Wi-Fi radio and the antenna, and what each one does.
2. **The ideas you need:** wavelength, 50 Ω, reflections (VSWR and return loss) and the matching network, with a worked example.
3. **Antennas on Wi-Fi boards:** PCB trace antennas, chip antennas and external antennas on u.FL and RP-SMA connectors.
4. **Build 1: a quarter-wave ground-plane antenna.** An omnidirectional 2.4 GHz antenna made from a connector and five pieces of wire.
5. **Build 2: a biquad.** A directional antenna of about 11 dBi made from copper wire, a copper pipe and a square of PCB.
6. **Designing for 6 GHz:** what changes for the Wi-Fi 6E / Wi-Fi 7 band (5925–7125 MHz), with both builds scaled to it.
7. **Testing, tuning and the rules:** measuring with a VNA or with signal strength alone, and staying within the legal power limit.

If you want the protocol side of Wi-Fi first, the [Wi-Fi Overview](/blog/wifi-overview/) post covers frames, security and channels. This post stays at the copper level.

---

### The Antenna Circuit

---

![Block diagram of the RF path in a Wi-Fi device. Wi-Fi radio inside the SoC (differential RF) connects to a balun (differential to single-ended), then a front-end module (PA for transmit, LNA for receive, T/R switch), then a band-pass or harmonic low-pass filter, then a π matching network, then the antenna (PCB trace, chip antenna or u.FL to an external antenna). Red arrows show transmit going right, blue arrows show receive going left. From the balun onwards everything is 50 Ω single-ended. Transmit is about +15 to +20 dBm; received signals can be as weak as −90 dBm](../../assets/img/wifi_antenna/rf_chain.png)

The same path carries both directions. Wi-Fi is half-duplex: a device either transmits or receives on a given radio at any moment, so one antenna can be shared.

| Block | What it does | Why it is there |
|---|---|---|
| **Wi-Fi radio** | Generates and decodes the RF signal inside the SoC | Usually has a differential RF port (two pins in antiphase) |
| **Balun** | Converts **bal**anced (differential) to **un**balanced (single-ended) | Antennas, coax and connectors are single-ended. Often a tiny ceramic part, or built into the chip |
| **Front-end module (FEM)** | **PA** boosts transmit power; **LNA** amplifies weak received signals; a **T/R switch** connects the antenna to one or the other | Many SoCs have a built-in PA and switch. Routers add external FEMs for more power and range |
| **Filter** | Passes the Wi-Fi band and blocks harmonics and nearby signals (cellular, for example) | Keeps the transmitter legal and the receiver from being overloaded |
| **Matching network** | Two or three small L/C parts that transform the antenna's impedance to 50 Ω | No antenna is exactly 50 Ω once it is in an enclosure |
| **Antenna** | Turns current on a conductor into a radiated wave, and back | The only block whose size is set by physics, not by the chip |

---

The dynamic range is enormous. A transmitter puts out about +20 dBm (100 mW). A receiver must decode signals around −90 dBm, which is 10⁻¹² W, or a picowatt. The ratio is 110 dB, a factor of 100 billion. A fraction of a decibel lost in the antenna circuit costs the same fraction in both directions.

---

### Wavelength: Why Wi-Fi Antennas Are Small

---

An antenna works best when its size is a simple fraction of the wavelength:

**λ = c / f**, or **λ (m) = 300 / f (MHz)**

![Bar chart drawn to scale. 2.4 GHz band at channel 6, 2437 MHz: one wavelength 123.0 mm, half wave (dipole) 61.5 mm, quarter wave (monopole) 30.8 mm. 5 GHz band at channel 100, 5500 MHz: wavelength 54.5 mm, half wave 27.3 mm, quarter wave 13.6 mm. Note: wire elements end up 2–5 % shorter than these free-space values, and PCB antennas shorter still](../../assets/img/wifi_antenna/wavelength.png)

- At **2.4 GHz** a quarter wave is about **31 mm**. That is why the little black stick antennas on routers are a few centimetres long, and a half-wave dipole inside them is about 6 cm.
- At **5 GHz** everything is about 2.2 times smaller: a quarter wave is about **14 mm**.
- Real elements come out slightly shorter than free-space values. With wire, the end effect trims 2–5 %. On a PCB, the fibreglass (FR-4, εr ≈ 4.4) slows the wave, so trace antennas are shorter still, and they are usually folded too.

Compare this with the AM radio in the [radio receiver post](/blog/radio_receiver/): a quarter wave at 1 MHz is 75 metres, so AM antennas are electrically tiny. At 2.4 GHz you can build a resonant antenna the size of your finger.

---

### 50 Ω, Reflections and VSWR

---

At these frequencies a PCB trace or a piece of coax is not just a wire. It is a **transmission line** with a characteristic impedance set by its geometry. Wi-Fi gear standardises on **50 Ω**: the radio output, the traces, the connectors, the coax and the antenna are all meant to look like 50 Ω.

When a 50 Ω line meets something that is not 50 Ω, part of the signal reflects back. The fraction is the **reflection coefficient**:

**Γ = (Z − 50) / (Z + 50)**

Reflected power is |Γ|². Two other numbers describe the same thing, and you will see both on datasheets and VNA screens:

- **Return loss (RL) = −20·log₁₀|Γ| dB.** Bigger is better.
- **VSWR = (1 + |Γ|) / (1 − |Γ|).** 1.0 is perfect.

| VSWR | Return loss | Power reflected | Mismatch loss | Verdict |
|---|---|---|---|---|
| 1.2 | 20.8 dB | 0.8 % | 0.04 dB | Excellent |
| 1.5 | 14.0 dB | 4 % | 0.18 dB | Good: typical spec for a finished product |
| 2.0 | 9.5 dB | 11 % | 0.51 dB | Acceptable: common limit for small antennas |
| 3.0 | 6.0 dB | 25 % | 1.25 dB | Poor |
| 5.0 | 3.5 dB | 44 % | 2.55 dB | Badly detuned |

---

Two things follow from this table. First, a VSWR of 2 only costs half a decibel, so you do not need perfection. Second, a badly detuned antenna can easily cost 2–3 dB, which at the edge of coverage is the difference between connected and not. Detuning is common: a hand, a metal case or a battery near the antenna can shift its resonance by tens of megahertz or more, enough to move it out of the band.

**On the PCB:** a 50 Ω microstrip on ordinary 1.6 mm two-layer FR-4 is about **3 mm wide**. That is wide, which is one reason many Wi-Fi boards use four layers, where a trace over a ground plane 0.2 mm below is only about 0.35 mm wide. Many boards use **coplanar waveguide**, a trace with ground poured on both sides and stitched with vias. Use your PCB tool's impedance calculator with your fab's stackup rather than guessing.

---

### The Matching Network

---

![Two panels. Panel A: the π footprint found on almost every Wi-Fi board. Radio (50 Ω out) connects to a shunt capacitor to ground (shunt 1, not fitted), then a series part (fitted with 0 Ω), then a second shunt to ground (shunt 2, not fitted), then the antenna. As shipped the network does nothing; you fit small L and C parts only after measuring. Panel B: worked example where the antenna measures 25 Ω at 2.45 GHz. The radio connects to a shunt 1.3 pF capacitor (X = −50 Ω), then a series 1.6 nH inductor (X = +25 Ω), then the 25 Ω antenna. Q = √(50/25 − 1) = 1, series X = 25 Ω, shunt X = 50 Ω](../../assets/img/wifi_antenna/matching.png)

Look near the antenna on almost any Wi-Fi board and you will find three 0402 or 0201 pads in a π shape. As designed, the series pad holds a **0 Ω resistor** and the two shunt pads are empty, so the network does nothing. They are there so the product can be **tuned after it is built**: once the board is in its case, an engineer measures the antenna with a VNA and fits the parts that bring it back to 50 Ω.

**Worked example: an L-match.** Say the antenna measures a resistive 25 Ω at 2.45 GHz, perhaps because a nearby ground pour has lowered it. To match it to 50 Ω:

1. **Q of the network:** Q = √(R_high / R_low − 1) = √(50/25 − 1) = **1**.
2. **Series reactance, next to the low-resistance side (the antenna):** X_s = Q × R_low = 25 Ω. As an inductor, L = X / (2πf) = 25 / (2π × 2.45×10⁹) ≈ **1.6 nH**.
3. **Shunt reactance, across the high-resistance side (the radio):** X_p = R_high / Q = 50 Ω. As a capacitor, C = 1 / (2πf·X) = 1 / (2π × 2.45×10⁹ × 50) ≈ **1.3 pF**.

So: shunt 1 gets 1.3 pF, the series pad gets 1.6 nH, and shunt 2 stays empty. The rule to remember is *series part next to the low impedance, shunt part across the high impedance*.

Real antennas also have a reactive part (R + jX), and the parts at these values come in coarse steps with their own parasitics. In practice you plot the antenna on a **Smith chart** in the VNA software, try standard values, and iterate. The calculation tells you the starting point and roughly which kind of part goes where.

---

### Antennas on Wi-Fi Boards

---

![Top view of a PCB with an inverted-F antenna. The board's top edge is a keep-out zone with no copper on any layer and no metal nearby. A copper trace forms the antenna: a short vertical stub connects one end to the ground plane (the short to ground), a second vertical trace a little to the right is the feed tap, and from them a long horizontal radiating arm runs along the edge, meandering at its far end. The feed tap continues down into the ground area as a 50 Ω coplanar trace with ground on both sides, ending at the chip's RF pin. Notes: arm length is about λ/4, shortened by FR-4 and meandered; distance from the short to the feed tap sets the impedance; copy a vendor reference layout exactly](../../assets/img/wifi_antenna/pcb_ifa.png)

**PCB trace antenna (inverted-F, IFA / MIFA).** This is the wiggly copper at the end of an ESP32 module or a USB Wi-Fi dongle. It is a quarter-wave monopole folded down parallel to the ground plane. The short to ground and the position of the feed tap set the impedance; the arm length sets the frequency. It costs nothing because it is just copper, but it is sensitive to everything around it. Rules:

- Keep the area under and around the antenna free of copper **on every layer**, as the module datasheet specifies.
- Put the antenna at a board edge, ideally a corner, sticking out past the ground plane.
- Keep metal, batteries, displays, screws and cables several millimetres to centimetres away. A metal enclosure turns a PCB antenna into a very good shield.
- **Copy the vendor's reference layout exactly**, including board thickness. Moving the feed tap by a millimetre changes the impedance.

**Chip antenna.** A small ceramic block, a few millimetres long, that replaces the trace. It still needs a ground clearance area and usually a matching network, because its performance depends heavily on the board it sits on. It is smaller than a trace antenna but rarely better.

**External antenna on a connector.** Modules ending in "U" (for example ESP32-WROOM-32U) or "-IPEX" have a **u.FL** (also called IPEX or MHF1) connector instead of a PCB antenna. A thin pigtail runs to an **RP-SMA** jack on the case and an external antenna. Things to know:

- u.FL is tiny and rated for only about **30 mating cycles**. Plug it once, straight down, and pull it off with a proper tool, not the cable.
- **RP-SMA** ("reverse polarity" SMA) is the Wi-Fi convention: the jack with outside threads has a **pin** in the middle. Ordinary SMA has the opposite. They screw together but do not connect, which is a classic "my new antenna made it worse" cause.
- Some dev boards have both a PCB antenna and a u.FL, selected by moving a **0 Ω resistor**. Check which one is fitted before you wonder why the external antenna does nothing.

**Coax loss matters at 2.4 GHz.** Rough figures per metre at 2.4 GHz:

| Cable | Diameter | Loss per metre |
|---|---|---|
| 1.13 mm micro-coax (u.FL pigtails) | 1.1 mm | ≈ 3–4 dB |
| RG-174 | 2.8 mm | ≈ 1.5–2 dB |
| RG-58 | 5 mm | ≈ 0.8–1 dB |
| LMR-400 | 10 mm | ≈ 0.22 dB |

---

A 3 dB loss halves your power and halves your received signal. Two metres of thin cable can therefore cancel the gain of a good antenna. Keep pigtails short; if the antenna must be far away, use thick cable, or move the radio to the antenna and run Ethernet instead.

---

### Build 1: Quarter-Wave Ground-Plane Antenna

---

This is the simplest real antenna there is: one quarter-wave wire for the radiator and four quarter-wave wires that act as its ground. It is omnidirectional (equal in all horizontal directions), has about 2–3 dBi of gain, and makes a good indoor antenna or a replacement for a lost router antenna.

![Side view of the ground-plane antenna. A vertical copper radiator of about 30 mm rises from the centre pin of a panel-mount SMA connector with a square 4-hole flange. Four radials of 31 mm each are soldered to the flange holes and bent down at 45°, which raises the impedance from 36 Ω to about 50 Ω. Coax runs down from the connector to the router or module. Steps: 1. Panel-mount SMA female with a 4-hole flange; routers use RP-SMA, so use a matching pigtail. 2. Cut 4 radials of 31 mm, solder one into each flange hole, bend them down 45°. 3. Solder a 33 mm radiator to the centre pin. 4. Trim 0.5 mm at a time, measuring from the top of the insulator, until the VNA dip or best RSSI sits at 2.44 GHz; it ends near 30 mm. For 5 GHz (5.5 GHz): radiator about 13 mm, radials about 14 mm](../../assets/img/wifi_antenna/groundplane.png)

---

#### Parts

---

| Part | Notes |
|---|---|
| Panel-mount SMA female connector, 4-hole flange | The square flange gives you four holes for the radials |
| 1.5 mm (about 14 AWG) solid copper wire, 20 cm | Strip it from mains house wire, or use brass rod |
| Pigtail or adapter to your device | Routers: SMA to RP-SMA. Modules: SMA to u.FL, as short as possible |
| Soldering iron (40 W or more), solder, side cutters, file, ruler or calipers | The flange soaks up heat, so use a big tip |

---

#### Assembly

---

1. **Radials.** Cut four pieces of wire 32 mm long, then file each to **31 mm**. Push one through each flange hole and solder it on the side away from the centre pin.
2. **Bend them down 45°.** Flat radials give about 36 Ω; drooping them toward the coax raises the impedance to close to 50 Ω. Bend all four the same way and the same amount.
3. **Radiator.** Solder a **33 mm** piece of wire to the centre pin. Keep the joint small: a blob of solder adds length.
4. **Trim.** Measure length from the **top of the connector's insulator**. Trim 0.5 mm at a time while testing (see [Testing and Tuning](#testing-and-tuning)). With 1.5 mm wire it usually ends up at about **29–30 mm**.
5. **Mount it vertical.** The antenna is vertically polarised: the radiator should point up, like the antennas on most routers and phones held upright.

For **5 GHz**, scale everything by 2437/5500: radiator about **13 mm** after trimming and radials about **14 mm**. At this size, a millimetre is about 7 % of the length, so trim in very small steps.

---

### Build 2: The Biquad

---

A biquad is two quarter-wave-sided squares fed at the middle and mounted in front of a flat reflector. The reflector sends everything forward, so the antenna has about **10–11 dBi** of gain in a beam about 50–70° wide. Use it to reach an access point in another building, or to aim at a far room from a fixed spot.

![Two views of the biquad. Front view: a 123 by 123 mm square reflector of copper-clad board or tin sheet, with two copper wire diamonds (squares turned 45°) side by side, meeting at a central feed point. Each side is 30.5 mm. Side view: the reflector is a vertical plate; a 10–12 mm copper pipe goes through it carrying the coax and holds the element 15 mm in front of the reflector. Feed: the two wire ends meet at the centre and go to the coax centre conductor; the wire's midpoint crosses the centre and goes to the pipe and coax braid; keep the two about 2 mm apart so they do not touch. One 2 mm copper wire, 8 sides of 30.5 mm, about λ/4 each. Aim the face of the element at the access point](../../assets/img/wifi_antenna/biquad.png)

---

#### Parts

---

| Part | Notes |
|---|---|
| 2 mm (12 AWG) solid copper wire, 30 cm | Element: 8 sides of 30.5 mm = 244 mm, plus a little spare |
| Copper-clad board or tin sheet, 123 × 123 mm | Reflector, about one wavelength square. Bigger is fine |
| Copper pipe, 10–12 mm diameter, about 40 mm long | Holds the element and carries the coax through the reflector |
| Short coax (RG-58 or better) + connector (N, SMA or RP-SMA) | Keep it short; see the cable loss table |
| Pliers, vice, ruler, soldering iron (60 W or more) | The reflector and pipe need a lot of heat |

---

#### Assembly

---

1. **Bend the element.** Mark the wire every **30.5 mm**. Starting from the centre of the wire, bend it into two squares turned 45° (diamonds) that meet at a single central point, as in the figure. Bend sharply with pliers and keep the squares flat. Accuracy to about 0.5 mm matters more than neatness.
2. **Drill and fit the pipe.** Drill a hole in the centre of the reflector, push the pipe through so about **15 mm** sticks out of the front, and solder it all the way round to the reflector.
3. **Feed the coax.** Strip the coax so the braid can be soldered to the front end of the pipe and the centre conductor sticks out about 5 mm.
4. **Solder the element.** The two wire **ends** meet at the centre: solder them together to the **coax centre conductor**. The **midpoint** of the wire, where it crosses the centre, solders to the **rim of the pipe** (the braid side). The two connections must be close, about 2 mm apart, but must **not touch**.
5. **Check spacing.** The element should be flat, parallel to the reflector and about **15 mm** in front of it.
6. **Weatherproof** if it goes outdoors: a plastic food box over the front works well. Avoid paint or anything containing metal or carbon in front of the element.

The polarisation follows the element: with the two diamonds **side by side**, as in the figure, the antenna is **vertically** polarised; stack them one above the other for horizontal polarisation. Try both orientations: on a short link the better one can be several dB stronger.

---

### Gain and Direction

---

![Two polar patterns. Left: ground plane or dipole, side view, two round lobes either side of the vertical radiator, 2–3 dBi in all directions round it and little straight up or down. Right: biquad, top view, a single forward lobe in front of the reflector, about 11 dBi forward, beam about 60° wide, almost nothing behind. Note: in free space every +6 dB of gain at both ends combined roughly doubles the range; the radio's power stays the same](../../assets/img/wifi_antenna/pattern.png)

An antenna does not add power. **Gain** means it concentrates the same power into fewer directions. The unit **dBi** compares that peak with an imaginary antenna that radiates equally in all directions (an isotropic radiator).

- A **ground plane or dipole** (2–3 dBi) spreads its power in a doughnut around itself. It is good when devices are all around you.
- A **biquad** (≈11 dBi) puts most of the power into one beam. It works only when it is pointed at the other end.

In free space, received signal falls 6 dB every time distance doubles, so **+6 dB of total antenna gain roughly doubles range**. Indoors, walls and reflections make this much less tidy, but the direction of the effect holds. Gain helps in both directions: a directional antenna on the receiving side also ignores interference from behind.

---

### Designing for 6 GHz (Wi-Fi 6E and Wi-Fi 7)

---

Wi-Fi 6E opened a third band at 6 GHz, and Wi-Fi 7 uses it for its 320 MHz channels. In the US and many other countries the band runs from **5925 to 7125 MHz**. In the EU and UK only the lower part, **5945 to 6425 MHz**, is open for Wi-Fi. The same physics applies as at 2.4 and 5 GHz, but several things get harder at once.

![Frequency axis from 2 to 7.4 GHz with the three Wi-Fi bands. 2.4 GHz: 2400–2483.5 MHz, 83.5 MHz wide, 3.4 % fractional bandwidth. 5 GHz: 5150–5895 MHz, 13.5 %. 6 GHz: 5925–7125 MHz in the US, 18.4 % bandwidth; EU and UK: 5945–6425 MHz. A callout marks only 30 MHz between the top of 5 GHz and the bottom of 6 GHz, so tri-band routers need sharp filters and antenna isolation. Below, quarter waves at band centre drawn to scale: 30.7 mm at 2442 MHz, 13.6 mm at 5500 MHz, 11.5 mm at 6525 MHz. Notes: at 6 GHz 1 mm is about 9 % of a quarter wave; hobby VNAs mostly stop near 6.3 GHz, below the top of the band](../../assets/img/wifi_antenna/six_ghz.png)

---

#### What changes at 6 GHz

---

| Issue | At 6 GHz | What to do about it |
|---|---|---|
| **Size and tolerance** | λ/4 ≈ 11.5 mm at 6525 MHz, so 1 mm of error shifts the resonance by about 9 % (roughly 600 MHz) | Cut long and trim in 0.2 mm steps; keep solder joints tiny; count the connector's pin length as part of the element |
| **Bandwidth** | The US band is 1200 MHz wide, 18.4 % of its centre frequency. A thin wire monopole covers perhaps 10–15 % at VSWR < 2 | Use a **thicker** radiator (2 mm rod rather than 1 mm wire): fatter elements have lower Q and wider bandwidth. Or centre the antenna on the channels you actually use |
| **Tri-band antennas** | One antenna for 2.4 + 5 + 6 GHz has to cover 5150–7125 MHz continuously, a 32 % span, plus 2.4 GHz | Designs use two radiating paths: a long arm for 2.4 GHz and a wide, short element (a fat stub or a tapered patch) for 5–7 GHz. Keep any matching network simple and low-Q, because a sharp match narrows the bandwidth |
| **5 / 6 GHz coexistence** | Only **30 MHz** separates the top of 5 GHz (5895 MHz) from the bottom of 6 GHz (5925 MHz). A tri-band router transmitting on one radio can deafen the other | Routers use steep BAW or ceramic filters on each radio, separate antennas spaced apart for **25 dB or more isolation**, and often keep the 5 GHz radio next to 6 GHz on low channels only |
| **PCB loss and εr** | FR-4 loss grows with frequency, and its εr varies from about 4.2 to 4.8 between batches, enough to move a PCB antenna by a few hundred MHz | Keep RF traces to a few centimetres. Use controlled-εr or low-loss laminate (for example Rogers RO4350B, εr ≈ 3.66) for the antenna area, or a validated module or chip antenna |
| **Cable loss** | Coax loss in dB grows roughly with √f: about 1.6 times the 2.4 GHz figures. That makes 1.13 mm micro-coax about 5–6 dB/m, RG-58 about 1.3 dB/m and LMR-400 about 0.36 dB/m | Keep pigtails as short as possible. A 30 cm pigtail matters more here than at 2.4 GHz |
| **Connectors** | Classic u.FL is specified to 6 GHz, below the top of the band. Wi-Fi 6E/7 cards (Intel AX210 and BE200, for example) use the smaller **MHF4** connector | Buy pigtails and antennas explicitly rated to 7.125 GHz. An old 2.4/5 GHz "dual-band" antenna is not a 6 GHz antenna, whatever it looks like |
| **Path loss and walls** | Free-space loss between fixed-gain antennas is 20·log₁₀(f₂/f₁) higher: 8.5 dB more than at 2.4 GHz and 1.5 dB more than at 5.5 GHz. Walls also absorb more | Expect 6 GHz to be a one-room or two-room band. More gain helps less than putting the access point in the right place |

---

#### Builds 1 and 2 scaled to 6 GHz

---

Both builds scale with wavelength. Multiply the 2.4 GHz dimensions by 2442 / f. The table uses the same correction factors as the 2.4 GHz builds, for the centre of the US band and the centre of the EU band:

| Dimension | 2.4 GHz build | 6 GHz, US band centre (6525 MHz) | 6 GHz, EU band centre (6185 MHz) |
|---|---|---|---|
| Ground plane: radiator (after trimming) | ≈ 30 mm | ≈ **11.2 mm** (start at 13 mm) | ≈ **11.8 mm** (start at 13.5 mm) |
| Ground plane: 4 radials at 45° | 31 mm | 11.6 mm | 12.2 mm |
| Biquad: each side (8 sides) | 30.5 mm | 11.4 mm | 12.0 mm |
| Biquad: reflector (minimum) | 123 mm | 46 mm (use 60 mm) | 49 mm (use 60 mm) |
| Biquad: element to reflector | 15 mm | 5.6 mm | 5.9 mm |
| Wire | 1.5 mm / 2 mm | 2 mm rod (radiator), 1 mm (biquad) | same |

Notes on building at this size:

- **The ground plane** still fits on a standard 4-hole SMA flange. SMA connectors themselves are fine at 6 GHz; they are rated to 18 GHz. Solder the radials close to the flange body so the extra lead length does not add up.
- **The biquad** becomes a matchbox-sized antenna. Bend the 1 mm wire around a jig: an 11.4 mm square block, or nails in a piece of wood. Use thin coax such as RG-316 through a small brass tube, and keep the feed gap about 1 mm.
- **Bandwidth:** neither antenna will cover the whole 5925–7125 MHz band at VSWR < 2 with thin wire. In the EU the band is only 480 MHz (7.8 %), so a well-trimmed build covers it. In the US, centre the antenna on the channels your access point uses.

---

#### The 6 GHz rules are different

---

Power in the 6 GHz band is regulated by **power spectral density** (dBm per MHz), in device classes, and not just by a single EIRP figure:

- **Low Power Indoor (LPI)**, the class most home routers use. In the US, access points are limited to 5 dBm/MHz, which reaches 30 dBm EIRP at 320 MHz, and clients to 6 dB less. **US LPI access points must have integrated antennas: no antenna connector is allowed at all**, so they must not be used outdoors. In the EU, LPI is indoor-only, at 23 dBm EIRP and 10 dBm/MHz.
- **Very Low Power (VLP)** allows indoor or outdoor portable use at 14 dBm EIRP.
- **Standard power** (US, parts of the band) allows more and works outdoors, but only under control of an **Automated Frequency Coordination (AFC)** database that protects licensed links.

In practice, a home-made 6 GHz antenna is a **learning and receive-testing project**. Fitting one to an LPI access point is not legal in the US, and adding gain anywhere in the band means cutting transmit power to stay under the PSD and EIRP limits. Check your country's 6 GHz rules first.

---

### Testing and Tuning

---

**With a VNA.** A small vector network analyser makes antenna building straightforward. For 2.4 GHz you need one that reaches at least 3 GHz, such as a NanoVNA V2-class unit; for 5 GHz, a LiteVNA-class unit that reaches about 6.3 GHz. That also covers most of the EU 6 GHz band, but not the US band above 6.3 GHz. There, use signal strength (below), or trim a test build at a lower frequency and scale it. Then:

1. Calibrate (open, short, load) **at the end of the cable** you will use, over 2.0–3.0 GHz.
2. Connect the antenna and display **S11 return loss** (or VSWR).
3. Look for the dip. If it sits **below** 2.44 GHz, the antenna is too **long**: trim it. If it sits above, it is too short: start again with a longer piece, because you cannot add copper back.
4. Aim for return loss better than 10 dB (VSWR under 2) across **2.40–2.48 GHz**.
5. Hold the antenna away from your hands, the table and the laptop while measuring. Everything nearby detunes it.

**Without a VNA.** You can still compare antennas using the signal strength your device reports:

- On Linux: `iw dev wlan0 link` shows `signal: -57 dBm` for the current connection. Run `watch -n 0.5 iw dev wlan0 link` while you move or trim the antenna.
- On a phone: a Wi-Fi analyser app shows RSSI per access point.

Swap between antennas at a fixed position and average several readings: Wi-Fi signal strength jumps around by a few dB from moment to moment. A difference of 1–2 dB is noise; 6 dB is real.

---

### Troubleshooting

---

| Symptom | Likely cause | Fix |
|---|---|---|
| New external antenna gives a weaker signal than the old one | SMA and RP-SMA mixed: the centre pin is not connected | Look inside both connectors: one must have a pin and the other a socket |
| Signal worse with the u.FL antenna than with the PCB antenna | 0 Ω selector resistor still routes to the PCB antenna; or the u.FL is not fully clicked in | Move the resistor per the board's schematic; press the u.FL straight down until it clicks |
| VNA dip far below 2.4 GHz | Element too long, or a big solder blob | Trim in small steps; measure from the insulator |
| No clear dip at all | Short at the feed (biquad wire touching the pipe), cracked joint, wrong calibration | Ground plane: centre to braid should read open on a meter. Biquad: the loop is a DC short by design, so a meter cannot find a touching feed; inspect the 2 mm gap by eye. Then recalibrate |
| Good at the bench, bad in the case | Enclosure, battery or metal detuning a PCB antenna | Keep-out area, plastic case, re-tune the matching network |
| Biquad works only at one angle | It is directional: that is the point | Aim it; try rotating 90° for polarisation |
| Long cable, no improvement | Coax loss eating the gain | Shorter or thicker cable, or move the radio closer to the antenna |

---

### The Rules: Power Limits

---

Wi-Fi is licence-free only within limits on **EIRP**, the effective isotropic radiated power:

**EIRP (dBm) = transmitter power (dBm) − cable loss (dB) + antenna gain (dBi)**

In the EU, for example, the 2.4 GHz band is limited to **20 dBm (100 mW) EIRP**. A router transmitting 18 dBm into a stock 2 dBi antenna is already at the limit, and the same router with an 11 dBi biquad would be 9 dB over. Other countries allow more, particularly for fixed point-to-point links, but every regulator has a rule.

So when you add gain, **turn the transmit power down** by the same amount. For the biquad in the EU that means about 20 − 11 = 9 dBm plus whatever your cable loses: `iw dev wlan0 set txpower fixed 900` sets 9 dBm (the unit is 0.01 dBm). Check the result with `iw dev wlan0 info`, because some drivers ignore or round the setting. You still keep the receive benefit, which is often what you were missing anyway. Check your own country's rules before using a high-gain antenna, especially on 5 GHz channels with DFS and per-channel limits.

Safety is easy at these powers: a 100 mW transmitter is far below exposure limits a short distance away. Do not run a high-power outdoor amplifier with your eye next to a dish, and do not stand in front of anyone else's.

---

### Going Further

---

- **Dual-band.** A single ground plane can work on both bands with a trap or a second, shorter radiator. Dual-band PCB antennas use two arms of different lengths. Start from a vendor design.
- **Cantenna.** A tin can is a circular waveguide. With the right diameter (roughly 76–100 mm for 2.4 GHz) and a quarter-wave probe at the right distance from the closed end, it makes a directional antenna of about 10 dBi.
- **Yagi and patch antennas.** A Yagi adds director elements for more gain in a narrower beam. A patch antenna is a copper square over a ground plane: it is easy to etch on PCB and is the basis of many flat panel antennas.
- **MIMO.** Modern Wi-Fi uses two to four antennas at once. They work best when they are spaced apart (at least half a wavelength) or polarised differently, so each one sees a different version of the signal.
- **Measure the whole board.** With a VNA and the board's π footprint, you can tune a product's own antenna after it is in its case, which is exactly what the footprint is for.

---

### Summary

---

- Between a Wi-Fi chip and the air are a **balun**, a **front-end module** (PA, LNA, switch), a **filter**, a **matching network** and the **antenna**. All of it is 50 Ω and carries both directions.
- Wi-Fi wavelengths are short: **λ/4 ≈ 31 mm at 2.4 GHz and ≈ 14 mm at 5 GHz**, which is why the antennas are small and why millimetres matter.
- Mismatch reflects power back. **VSWR under 2 (return loss over 10 dB)** is good enough. Detuning by hands, cases and metal is the common real-world problem.
- The **π footprint** next to every antenna exists to correct that after the product is built. The rule for an L-match is series part next to the low impedance, shunt part across the high impedance.
- **PCB antennas** need a copper-free keep-out and an exact copy of the reference layout. **u.FL + RP-SMA** connectors are fragile and easy to mix up, and thin coax is lossy.
- **Build 1**, a ground plane from an SMA connector and five wires, gives about 2–3 dBi in every direction. **Build 2**, a biquad, gives about 11 dBi in one direction.
- **6 GHz** (Wi-Fi 6E/7) is wide (18 % of its centre frequency in the US), very close to 5 GHz, lossier and less tolerant: λ/4 is ≈ 11.5 mm, so 1 mm matters. Use fatter elements, short cables and connectors rated to 7.125 GHz. US LPI access points may not have external antennas at all.
- Gain redirects power rather than adding it. Keep within the **EIRP** limit by lowering transmit power when you add antenna gain.
