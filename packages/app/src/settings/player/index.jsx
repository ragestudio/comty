import loadable from "@loadable/component"

export default {
    id: "player",
    icon: "PlayCircleOutlined",
    label: "Player",
    group: "app",
    settings: [
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
                    1: "Normal",
                    1.5: "+50%",
                    2: "+100%"
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
        },
        {
            id: "player.sample_rate",
            title: "Sample Rate",
            icon: "MdHearing",
            group: "general",
            description: "Internal sample rate for audio output",
            component: "Select",
            props: {
                options: [
                    {
                        value: 44100,
                        label: "44100 Hz"
                    },
                    {
                        value: 48000,
                        label: "48000 Hz"
                    },
                    {
                        value: 96000,
                        label: "96000 Hz"
                    },
                    {
                        value: 192000,
                        label: "192000 Hz"
                    }
                ]
            },
            defaultValue: (ctx) => {
                return app.cores.player.audioContext.sampleRate
            },
            onUpdate: async (value) => {
                const sampleRate = await app.cores.player.setSampleRate(value)

                return sampleRate
            },
            storaged: false,
        },
        {
            id: "player.compressor.values",
            title: "Compression",
            icon: "FiSliders",
            group: "general",
            description: "Adjust compression values (Warning: may cause distortion when changing values)",
            experimental: true,
            dependsOn: {
                "player.compressor": true
            },
            component: loadable(() => import("./items/player.compressor")),
            switchDefault: () => {
                return app.cores.settings.get("player.compressor")
            },
            onEnabledChange: (enabled) => {
                if (enabled === true) {
                    app.cores.settings.set("player.compressor", true)
                    app.cores.player.compressor.attach()
                } else {
                    app.cores.settings.set("player.compressor", false)
                    app.cores.player.compressor.detach()
                }
            },
            props: {
                valueFormat: (value) => `${value}dB`,
                sliders: [
                    {
                        key: "threshold",
                        label: "Threshold",
                        min: -100,
                        max: 0,
                    },
                    {
                        key: "knee",
                        label: "Knee",
                        min: 0,
                        max: 40,
                    },
                    {
                        key: "ratio",
                        label: "Ratio",
                        min: 1,
                        max: 20,
                        valueFormat: (value) => `${value}:1`,
                    },
                    {
                        key: "attack",
                        label: "Attack",
                        min: 0,
                        max: 1,
                        valueFormat: (value) => `${value} s`,
                    },
                    {
                        key: "release",
                        label: "Release",
                        min: 0,
                        max: 1,
                        valueFormat: (value) => `${value} s`,
                    },
                ],
            },
            extraActions: [
                {
                    id: "reset",
                    title: "Default",
                    icon: "MdRefresh",
                    onClick: async (ctx) => {
                        const values = await app.cores.player.compressor.resetDefaultValues()

                        ctx.updateCurrentValue(values)
                    }
                }
            ],
            onUpdate: (value) => {
                app.cores.player.compressor.modifyValues(value)

                return value
            },
            storaged: false,
        },

        {
            id: "player.eq",
            title: "Equalizer",
            group: "general",
            icon: "MdGraphicEq",
            description: "Enable equalizer for audio output",
            component: loadable(() => import("./items/player.eq")),
            extraActions: [
                {
                    id: "reset",
                    title: "Reset",
                    icon: "MdRefresh",
                    onClick: (ctx) => {
                        const values = app.cores.player.eq.resetDefaultValues()

                        ctx.updateCurrentValue(values)
                    }
                },
            ],
            dependsOn: {
                "player.equalizer": true
            },
            props: {
                valueFormat: (value) => `${value}dB`,
                marks: [
                    {
                        value: 0,
                    }
                ],
                step: 0.5,
                sliders: [
                    {
                        key: 32,
                        label: "32",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 64,
                        label: "64",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 125,
                        label: "125",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 250,
                        label: "250",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 500,
                        label: "500",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 1000,
                        label: "1K",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 2000,
                        label: "2K",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 4000,
                        label: "4K",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 8000,
                        label: "8K",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 16000,
                        label: "16K",
                        max: 10,
                        min: -10,
                    }
                ]
            },
            onUpdate: (value) => {
                const values = Object.keys(value).reduce((acc, key) => {
                    acc[key] = value[key]

                    return acc
                }, {})

                app.cores.player.eq.modifyValues(values)

                return value
            },
            storaged: false
        }
    ]
}