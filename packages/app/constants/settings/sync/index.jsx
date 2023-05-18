import React from "react"
import loadable from "@loadable/component"
import SyncModel from "models/sync"

// TODO: Make logout button require a valid session to be not disabled

export default {
    id: "sync",
    icon: "MdSync",
    label: "Sync",
    group: "advanced",
    disabled: true,
    ctxData: async () => {
        const spotifyAccount = await SyncModel.spotifyCore.getData().catch((err) => {
            return null
        })

        return {
            spotifyAccount
        }
    },
    settings: [
        {
            id: "sync_settings",
            icon: "MdSync",
            title: "Sync Settings",
            description: "Sync your settings across all devices stored in the cloud",
            group: "sync.settings",
            component: "Switch"
        },
        {
            id: "spotify",
            icon: "SiSpotify",
            title: "Spotify",
            description: "Sync your Spotify account to get access to Spaces, playlists and more",
            group: "sync.accounts",
            component: loadable(() => import("./components/spotifySync")),
            storaged: false
        },
        {
            id: "soundcloud",
            icon: "SiSoundcloud",
            title: "SoundCloud",
            group: "sync.accounts",
            component: () => <p>Not implemented</p>,
            storaged: false
        },
        {
            id: "youtube",
            icon: "SiYoutube",
            title: "YouTube",
            group: "sync.accounts",
            component: () => <p>Not implemented</p>,
            storaged: false
        },
        {
            id: "twitch",
            icon: "SiTwitch",
            title: "Twitch",
            group: "sync.accounts",
            component: () => <p>Not implemented</p>,
            storaged: false
        },
        {
            id: "twitter",
            icon: "SiTwitter",
            title: "Twitter",
            group: "sync.accounts",
            component: () => <p>Not implemented</p>,
            storaged: false
        },
        {
            id: "instagram",
            icon: "SiInstagram",
            title: "Instagram",
            group: "sync.accounts",
            component: () => <p>Not implemented</p>,
            storaged: false
        },
        {
            id: "mixcloud",
            icon: "SiMixcloud",
            title: "Mixcloud",
            group: "sync.accounts",
            component: () => <p>Not implemented</p>,
            storaged: false
        },
        {
            id: "discord",
            icon: "SiDiscord",
            title: "Discord",
            group: "sync.accounts",
            component: () => <p>Not implemented</p>,
            storaged: false
        }
    ]
}