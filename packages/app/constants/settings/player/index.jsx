import loadable from "@loadable/component"

export default {
    id: "player",
    icon: "PlayCircleOutlined",
    label: "Player",
    group: "app",
    settings: [
        {
            id: "player.allowVolumeOver100",
            title: "Allow volume over 100%",
            group: "general",
            icon: "MdHearing",
            description: "Allow volume amplification over 100% (may cause distortion)",
            component: "Switch",
            storaged: true,
        },
        {
            id: "player.crossfade",
            title: "Crossfade",
            icon: "MdSwapHoriz",
            group: "general",
            description: "Enable crossfade between tracks",
            component: "Slider",
            props: {
                min: 0,
                max: 10,
                step: 0.1,
                marks: {
                    0: "Off",
                    1: "1s",
                    2: "2s",
                    3: "3s",
                    4: "4s",
                    5: "5s",
                    6: "6s",
                    7: "7s",
                    8: "8s",
                    9: "9s",
                    10: "10s",
                }
            },
            storaged: true,
            disabled: true,
        },
        {
            id: "player.compressor",
            title: "Compression",
            icon: "MdGraphicEq",
            group: "general",
            description: "Enable compression for audio output",
            component: "Switch",
            experimental: true,
            beforeSave: (value) => {
                if (value) {
                    app.cores.player.compressor.attach()
                } else {
                    app.cores.player.compressor.detach()
                }
            },
            storaged: true,
        },
        {
            id: "player.compressor.values",
            title: "Compression adjustment",
            icon: "Sliders",
            group: "general",
            description: "Adjust compression values (Warning: may cause distortion when changing values)",
            experimental: true,
            extraActions: [
                {
                    id: "reset",
                    title: "Reset",
                    icon: "MdRefresh",
                    onClick: (ctx) => {
                        const values = app.cores.player.compressor.resetDefaultValues()

                        ctx.updateCurrentValue(values)
                    }
                }
            ],
            defaultValue: () => {
                return app.cores.player.compressor.values
            },
            onUpdate: (value) => {
                app.cores.player.compressor.modifyValues(value)

                return value
            },
            component: loadable(() => import("../components/compressorValues")),
            dependsOn: {
                "player.compressor": true
            },
            storaged: false,
        },
        {
            id: "player.gain",
            title: "Gain",
            icon: "MdGraphicEq",
            group: "general",
            description: "Adjust gain for audio output",
            component: "Slider",
            props: {
                min: 1,
                max: 2,
                step: 0.1,
                marks: {
                    1: "Off",
                    1.5: "50%",
                    2: "100%"
                }
            },
            defaultValue: () => {
                return app.cores.player.gain.values().gain
            },
            onUpdate: (value) => {
                app.cores.player.gain.modifyValues({
                    gain: value
                })
            },
            storaged: false,
        }
    ]
}