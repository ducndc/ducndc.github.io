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
	// Folders below have no custom text yet: the title comes from the folder name and the
	// date comes from the photos' EXIF. Add title / description / captions here to tell the story.
	'CatBa-HaiPhong': { title: 'Cat Ba', coords: [20.8, 107.05] },
	'LaoThan-LaoCai': { title: 'Lao Than', coords: [22.63, 103.63] },
	'TamDao-VinhPhuc': { title: 'Tam Dao', coords: [21.46, 105.64] },
	'VuonVua-PhuTho': { title: 'Vuon Vua', coords: [21.17, 105.2] },
};
