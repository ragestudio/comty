const path = require('path')

const aliases = {
    "@antd": path.resolve(__dirname, "../../node_modules/antd"),
    "@": path.resolve(__dirname, 'src'),
    schemas: path.resolve(__dirname, 'constants'),
    controllers: path.resolve(__dirname, 'src/controllers'),
    extensions: path.resolve(__dirname, 'src/extensions'),
    theme: path.join(__dirname, 'src/theme'),
    locales: path.join(__dirname, 'src/locales'),
    core: path.join(__dirname, 'src/core'),
    "@pages": path.join(__dirname, 'src/pages'),
    components: path.join(__dirname, 'src/components'),
    models: path.join(__dirname, 'src/models'),
}

module.exports = (config) => {
    if (typeof config.windowContext.process === 'undefined') {
        config.windowContext.process = Object()
    }

    config.windowContext.process = config.windowContext.__evite
    config.windowContext.process["versions"] = process.versions
    config.resolve.alias = {
        ...config.resolve.alias,
        ...aliases,
    }
    config.aliases = {
        ...config.resolve.alias,
        ...aliases,
    }

    config.css = {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            }
        }
    }

    return config
}