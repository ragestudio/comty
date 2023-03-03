export default {
    id: "player",
    icon: "PlayCircleOutlined",
    label: "Player",
    group: "app",
    settings: [
        {
            id: "player.allowVolumeOver100",
            label: "Allow volume over 100%",
            description: "Allow volume amplification over 100% (may cause distortion)",
            component: "Switch",
            storaged: true,
        },
        {
            id: "player.crossfade",
            label: "Crossfade",
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
                },
            },
            storaged: true,
        }
    ]
}