const path = require("path")
const { builtinModules } = require("module")

const aliases = {
    "~/": `${path.resolve(__dirname, "src")}/`,
    "__": __dirname,
    "@src": path.resolve(__dirname, "src"),
    schemas: path.resolve(__dirname, "constants"),
    config: path.join(__dirname, "config"),
    extensions: path.resolve(__dirname, "src/extensions"),
    pages: path.join(__dirname, "src/pages"),
    theme: path.join(__dirname, "src/theme"),
    components: path.join(__dirname, "src/components"),
    models: path.join(__dirname, "src/models"),
    utils: path.join(__dirname, "src/utils"),
}

module.exports = (config = {}) => {
    if (!config.resolve) {
        config.resolve = {}
    }
    if (!config.server) {
        config.server = {}
    }

    config.resolve.alias = aliases
    config.server.port = process.env.listenPort ?? 8000
    config.server.host = "0.0.0.0"
    config.server.fs = {
        allow: [".."]
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
        sourcemap: "inline",
        target: `node16`,
        outDir: "dist",
        assetsDir: ".",
        minify: process.env.MODE !== "development",
        lib: {
            entry: "src/index.ts",
            formats: ["cjs"],
        },
        rollupOptions: {
            external: [
                "electron",
                "electron-devtools-installer",
                ...builtinModules.flatMap(p => [p, `node:16`]),
            ],
            output: {
                entryFileNames: "[name].cjs",
            },
        },
        emptyOutDir: true,
        brotliSize: false,
    }

    return config
}