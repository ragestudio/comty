import getConfig from "./.config.js"

import { defineConfig } from "vite"
import reactRefresh from "@vitejs/plugin-react-refresh"

import Pages from "vite-plugin-pages"

export default defineConfig({
    plugins: [
        reactRefresh(),
        Pages({
            react: true,
            routeStyle: "next",
            extensions: ["jsx", "tsx"],
        }),
    ],
    ...getConfig(),
})