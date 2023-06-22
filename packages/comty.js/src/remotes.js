function composeRemote(path) {
    if (typeof window !== "undefined") {
        if (window.localStorage.getItem("comty:use_indev") || window.location.hostname === "indev.comty.app") {
            return envOrigins["indev"][path]
        }
    }

    return envOrigins[process.env.NODE_ENV ?? "production"][path]
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
        chat: `http://${getCurrentHostname()}:3020`,
        livestreaming: `http://${getCurrentHostname()}:3030`,
        marketplace: `http://${getCurrentHostname()}:3040`,
        music: `http://${getCurrentHostname()}:3050`,
        files: `http://${getCurrentHostname()}:3060`,
    },
    "indev": {
        default: `https://indev_api.comty.app/default`,
        chat: `https://indev_api.comty.app/chat`,
        livestreaming: `https://indev_api.comty.app/livestreaming`,
        marketplace: `https://indev_api.comty.app/marketplace`,
        music: `https://indev_api.comty.app/music`,
        files: `https://indev_api.comty.app/files`,
    },
    "production": {
        default: "https://api.comty.app",
        chat: `https://chat_api.comty.app`,
        livestreaming: `https://livestreaming_api.comty.app`,
        marketplace: `https://marketplace_api.comty.app`,
        music: `https://music_api.comty.app`,
        files: `https://files_api.comty.app`,
    }
}

export default {
    default: {
        origin: composeRemote("default"),
        hasWebsocket: true,
        useClassicAuth: true,
        autoconnect: true,
    },
    chat: {
        origin: composeRemote("chat"),
        hasWebsocket: true,
    },
    music: {
        origin: composeRemote("music"),
        hasWebsocket: true,
    },
    livestreaming: {
        origin: composeRemote("livestreaming"),
    },
    marketplace: {
        origin: composeRemote("marketplace"),
    },
    files: {
        origin: composeRemote("files"),
        hasWebsocket: false,
    }
}