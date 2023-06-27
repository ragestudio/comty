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
            id: "player.sample_rate",
            title: "Sample rate",
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
            component: loadable(() => import("../components/sliderValues")),
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
        },
        {
            id: "player.eq",
            title: "Equalizer",
            group: "general",
            icon: "MdGraphicEq",
            description: "Enable equalizer for audio output",
            component: loadable(() => import("../components/sliderValues")),
            extraActions: [
                {
                    id: "reset",
                    title: "Reset",
                    icon: "MdRefresh",
                    onClick: (ctx) => {
                        const values = app.cores.player.eq.resetDefaultValues()

                        ctx.updateCurrentValue(values)
                    }
                }
            ],
            props: {
                valueFormat: (value) => `${value}dB`,
                sliders: [
                    {
                        key: 32,
                        label: "32 Hz",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 64,
                        label: "64 Hz",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 125,
                        label: "125 Hz",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 250,
                        label: "250 Hz",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 500,
                        label: "500 Hz",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 1000,
                        label: "1000 Hz",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 2000,
                        label: "2000 Hz",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 4000,
                        label: "4000 Hz",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 8000,
                        label: "8 kHz",
                        max: 10,
                        min: -10,
                    },
                    {
                        key: 16000,
                        label: "16 kHz",
                        max: 10,
                        min: -10,
                    }
                ]
            },
            defaultValue: () => {
                const values = app.cores.player.eq.values().eqValues

                return Object.keys(values).reduce((acc, key) => {
                    acc[key] = values[key].gain

                    return acc
                }, {})
            },
            onUpdate: (value) => {
                const values = Object.keys(value).reduce((acc, key) => {
                    acc[key] = {
                        gain: value[key]
                    }

                    return acc
                }, {})

                app.cores.player.eq.modifyValues(values)

                return value
            },
            storaged: false
        }
    ]
}