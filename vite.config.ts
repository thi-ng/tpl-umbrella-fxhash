import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";

export default defineConfig({
	// Remove hash according to https://github.com/fxhash/fxhash-boilerplate
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  },
  server: {
		// https://developer.chrome.com/articles/x-google-ignore-list/
		// https://vitejs.dev/config/server-options.html#server-sourcemapignorelist
		sourcemapIgnoreList: (path) =>
			path.includes("node_modules") && !path.includes("@thi.ng"),
	},
	plugins: [createHtmlPlugin({ minify: true })],
});
