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
            key: path.join(__dirname, ".ssl", "privkey.pem"),
            cert: path.join(__dirname, ".ssl", "cert.pem"),
        },
        headers: {
            "Strict-Transport-Security": `max-age=${oneYearInSeconds}`
        },
        proxy: {
            "/api": {
                target: "https://0.0.0.0:9000",
                rewrite: (path) => path.replace(/^\/api/, ""),
                hostRewrite: true,
                changeOrigin: true,
                xfwd: true,
                //ws: true,
                toProxy: true,
                secure: false,
            }
        }
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
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return id.toString().split('node_modules/')[1].split('/')[0].toString();
                    }
                }
            }
        }
    },
    esbuild: {
        supported: {
            "top-level-await": true //browsers can handle top-level-await features
        },
    }
})