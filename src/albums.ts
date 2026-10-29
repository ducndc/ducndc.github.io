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
}

export const ALBUMS: Record<string, Album> = {
	MuCangChai: {
		title: 'Golden Terraces of Mu Cang Chai',
		location: 'Mu Cang Chai, Yen Bai · Vietnam',
		date: 'Sep 2026',
		description:
			'Rice terraces ripening into gold, afternoon light over the valleys, and morning mist rolling between the mountains.',
		cover: 'IMG_8664.JPG',
	},
	samu: {
		title: 'Cloudy Sky on Samu Peak',
		location: 'Bac Yen, Son La · Vietnam',
		date: 'Dec 2025',
		description:
			'A solo trek through the mossy forests of Ta Xua to the 2756 m summit of Samu, above a sea of clouds.',
		post: 'samu-trecking',
		cover: 'about.jpg',
	},
};
