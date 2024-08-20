import path from "path"
import aliases from "./aliases"

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const oneYearInSeconds = 60 * 60 * 24 * 365

export default defineConfig({
    plugins: [
        react(),
    ],
    resolve: {
        alias: aliases,
    },
    server: {
        host: "0.0.0.0",
        port: 8000,
        fs: {
            allow: ["..", "../../"],
        },
        https: {
            key: path.join(__dirname, "ssl", "privkey.pem"),
            cert: path.join(__dirname, "ssl", "cert.pem"),
        },
        headers: {
            "Strict-Transport-Security": `max-age=${oneYearInSeconds}`
        },
    },
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            }
        }
    },
    optimizeDeps: {
        esbuildOptions: {
            target: "esnext"
        }
    },
    build: {
        target: "esnext",
    },
    esbuild: {
        supported: {
            "top-level-await": true //browsers can handle top-level-await features
        },
    }
})