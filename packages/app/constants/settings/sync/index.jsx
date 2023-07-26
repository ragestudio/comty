import React from "react"
import loadable from "@loadable/component"
import SyncModel from "models/sync"

// TODO: Make logout button require a valid session to be not disabled

export default {
    id: "sync",
    icon: "MdSync",
    label: "Sync",
    group: "advanced",
    //disabled: true,
    ctxData: async () => {
        const spotifyAccount = await SyncModel.spotifyCore.getData().catch((err) => {
            return null
        })

        const tidalData = await SyncModel.tidalCore.getCurrentUser().catch((err) => {
            return null
        })

        return {
            publicData: {
                spotify: spotifyAccount,
                tidal: tidalData,
            }
        }
    },
    settings: [
        {
            id: "sync_settings",
            icon: "MdSync",
            title: "Sync Settings",
            description: "Sync your settings across all devices stored in the cloud",
            group: "sync.settings",
            component: "Switch",
            disabled: true,
            storaged: false,
        },
        {
            id: "spotify",
            icon: "SiSpotify",
            title: "Spotify",
            description: "Sync your Spotify account to get access to your playlists and other features",
            group: "sync.accounts",
            component: loadable(() => import("./components/syncAccountButton")),
            props: {
                icon: "SiSpotify",
                namespace: "spotify"
            },
            storaged: false
        },
        {
            id: "tidal",
            icon: "SiTidal",
            title: "Tidal",
            description: "Sync your Tidal account to get access to your audio playback and playlists sync",
            group: "sync.accounts",
            component: loadable(() => import("./components/syncAccountButton")),
            props: {
                icon: "SiTidal",
                namespace: "tidal"
            },
            storaged: false
        }
    ]
}