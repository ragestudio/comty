import path from "path"
import getConfig from "./.config.js"

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

//import electron, { onstart } from "vite-plugin-electron"

export default defineConfig({
    plugins: [
        react(),
    ],
    ...getConfig(),
})