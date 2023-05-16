const path = require("path")
const { builtinModules } = require("module")

const aliases = {
    "node:buffer": "buffer",
    "~": __dirname,
    "~/": `${path.resolve(__dirname, "src")}/`,
    "@src": path.join(__dirname, "src"),
    cores: path.join(__dirname, "src/cores"),
    schemas: path.join(__dirname, "constants"),
    config: path.join(__dirname, "config"),
    extensions: path.resolve(__dirname, "src/extensions"),
    pages: path.join(__dirname, "src/pages"),
    theme: path.join(__dirname, "src/theme"),
    components: path.join(__dirname, "src/components"),
    utils: path.join(__dirname, "src/utils"),
    layouts: path.join(__dirname, "src/layouts"),
    hooks: path.join(__dirname, "src/hooks"),
    "comty.js": path.join(__dirname, "../", "comty.js", "src"),
    models: path.join(__dirname, "../comty.js/src/models"),
}

module.exports = (config = {}) => {
    if (!config.resolve) {
        config.resolve = {}
    }
    if (!config.server) {
        config.server = {}
    }

    // config.define = {
    //     "global.Uint8Array": "Uint8Array",
    //     "process.env.NODE_DEBUG": false,
    // }

    config.resolve.alias = aliases
    config.server.port = process.env.listenPort ?? 8000
    config.server.host = "0.0.0.0"
    config.server.fs = {
        allow: ["..", "../../"],
    }

    config.envDir = path.join(__dirname, "environments")

    config.css = {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            }
        }
    }

    config.build = {
        target: "esnext"
    }

    // config.build = {
    //     sourcemap: "inline",
    //     target: `node16`,
    //     outDir: "dist",
    //     assetsDir: ".",
    //     minify: process.env.MODE !== "development",
    //     rollupOptions: {
    //         external: [
    //             "electron",
    //             "electron-devtools-installer",
    //             ...builtinModules.flatMap(p => [p, `node:16`]),
    //         ],
    //         output: {
    //             entryFileNames: "[name].js",
    //         },
    //     },
    //     emptyOutDir: true,
    //     brotliSize: false,
    // }

    return config
}