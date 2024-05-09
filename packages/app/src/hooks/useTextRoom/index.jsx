import React from "react"
import { EventEmitter } from "@foxify/events"

function useTextRoom(route, options = {
    persistent: false,
}) {
    const eventEmitter = new EventEmitter()

    const [lines, setLines] = React.useState([])

    const socket = app.cores.api.client().sockets.chats

    function pushToLines(line) {
        setLines((lines) => {
            return [
                ...lines,
                line,
            ]
        })
    }

    function deleteLine(message) {
        setLines((lines) => {
            return lines.filter((line) => line._id !== message._id)
        })
    }

    function send(payload) {
        socket.emit("room:send:message", {
            ...payload,
            route: route,
        })
    }

    const socketEvents = {
        "room:message": (message) => {
            eventEmitter.emit("room:message", message)
            pushToLines(message)
        },
        "room:delete:message": (message) => {
            eventEmitter.emit("room:delete:message", message)
            deleteLine(message)
        }
    }

    React.useEffect(() => {
        socket.emit("join:room", {
            ...options,
            room: route,
        })

        for (const [event, handler] of Object.entries(socketEvents)) {
            socket.on(event, handler)
        }

        return () => {
            socket.emit("leave:room", {
                room: route,
            })

            for (const [event, handler] of Object.entries(socketEvents)) {
                socket.off(event, handler)
            }
        }
    }, [])

    return [send, lines, setLines, eventEmitter]
}

export default useTextRoom