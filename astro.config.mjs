// @ts-check

//import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// https://astro.build/config
export default defineConfig({
	site: 'https://ducndc.github.io',
	base: '/',
	integrations: [sitemap()],
	markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
	vite: {
		server: {
			// public/prplmesh holds ~62k generated Doxygen files; watching them
			// exhausts the inotify limit (ENOSPC) in `astro dev`.
			watch: { ignored: ['**/public/prplmesh/**'] },
		},
	},
});