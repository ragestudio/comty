function composeRemote(path) {
    return envOrigins[process.env.NODE_ENV][path]
}

function getCurrentHostname() {
    if (typeof window === "undefined") {
        return "localhost"
    }

    return window?.location?.hostname ?? "localhost"
}

const envOrigins = {
    "development": {
        default: `http://${getCurrentHostname()}:3010`,
        messaging: `http://${getCurrentHostname()}:3020`,
        livestreaming: `http://${getCurrentHostname()}:3030`,
        marketplace: `http://${getCurrentHostname()}:3040`,
    },
    "production": {
        default: "https://api.comty.app",
        messaging: `https://messaging_api.comty.app`,
        livestreaming: `https://livestreaming_api.comty.app`,
        marketplace: `https://marketplace_api.comty.app`,
    }
}

export default {
    default: {
        origin: composeRemote("default"),
        hasWebsocket: true,
        needsAuth: true,
    },
    messaging: {
        origin: composeRemote("messaging"),
        hasWebsocket: true,
        needsAuth: true,
    },
    livestreaming: {
        origin: composeRemote("livestreaming"),
    },
    marketplace: {
        origin: composeRemote("marketplace"),
    },
}