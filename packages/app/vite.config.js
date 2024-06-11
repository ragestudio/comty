import path from "path"

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const aliases = {
    "@": path.join(__dirname, "src"),
    "@config": path.join(__dirname, "config"),
    "@cores": path.join(__dirname, "src/cores"),
    "@pages": path.join(__dirname, "src/pages"),
    "@styles": path.join(__dirname, "src/styles"),
    "@components": path.join(__dirname, "src/components"),
    "@contexts": path.join(__dirname, "src/contexts"),
    "@utils": path.join(__dirname, "src/utils"),
    "@layouts": path.join(__dirname, "src/layouts"),
    "@hooks": path.join(__dirname, "src/hooks"),
    "@classes": path.join(__dirname, "src/classes"),
    "@models": path.join(__dirname, "../../", "comty.js/src/models"),
    "comty.js": path.join(__dirname, "../../", "comty.js", "src"),
}

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
    },
    esbuild: {
        supported: {
            "top-level-await": true //browsers can handle top-level-await features
        },
    }
})