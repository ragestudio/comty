let port

async function stream(url) {
    return (await fetch(url)).body
}

async function* process(reader) {
    while (true) {
        const { value, done } = await reader.read()

        if (done) {
            break;
        }

        yield port.postMessage(value, [value.buffer])
    }
}

onmessage = async (e) => {
    'use strict'

    if (!port) {
        [port] = e.ports;
        port.onmessage = event => postMessage(event.data)
    }

    const { url, codec } = e.data

    const _stream = await stream(url)
    const reader = _stream.getReader()

    while (true) {
        const { value, done } = await reader.read()

        if (done) {
            break;
        }

        port.postMessage(value, [value.buffer])
    }

    console.log('read/write done')
}