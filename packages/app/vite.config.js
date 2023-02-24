import { defineConfig } from "vite"

import react from "@vitejs/plugin-react"

import getConfig from "./.config.js"

export default defineConfig({
    plugins: [
        react(),
    ],
    ...getConfig(),
})