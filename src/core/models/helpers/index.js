import StreamingOverlay from 'components/StreamingOverlay'

export function goLive(payload) {
    window.overlaySwap.open({
        id: 'search',
        mode: 'half',
        size: "50%",
        element: <StreamingOverlay />
    })
}