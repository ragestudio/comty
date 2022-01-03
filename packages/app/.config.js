const path = require('path')

const aliases = {
    '~/': `${path.resolve(__dirname, 'src')}/`,
    "__": __dirname,
    "@src": path.resolve(__dirname, 'src'),
    schemas: path.resolve(__dirname, 'constants'),
    config: path.join(__dirname, 'config'),
    extensions: path.resolve(__dirname, 'src/extensions'),
    pages: path.join(__dirname, 'src/pages'),
    theme: path.join(__dirname, 'src/theme'),
    components: path.join(__dirname, 'src/components'),
    models: path.join(__dirname, 'src/models'),
}

module.exports = (config = {}) => {
    if (!config.resolve) {
        config.resolve = {}
    }
    if (!config.server) {
        config.server = {}
    }

    config.resolve.alias = aliases
    config.server.port = 8000
    config.server.host = "0.0.0.0"
    config.server.fs = {
        allow: [".."]
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