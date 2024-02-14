import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import wasm from "vite-plugin-wasm"

import getConfig from "./.config.js"

export default defineConfig({
    plugins: [
        react(),
        wasm(),
    ],
    ...getConfig(),
})