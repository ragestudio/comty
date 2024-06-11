import React from "react"

export default (to_user_id) => {
    const [socket, setSocket] = React.useState(null)
    const [messages, setMessages] = React.useState([])
    const [scroller, setScroller] = React.useState(null)

    const [isLocalTyping, setIsLocalTyping] = React.useState(false)
    const [isRemoteTyping, setIsRemoteTyping] = React.useState(false)

    const [timeoutOffTypingEvent, setTimeoutOffTypingEvent] = React.useState(null)
    
    async function sendMessage(message) {
        emitTypingEvent(false)

        await socket.emit("chat:send:message", {
            to_user_id: to_user_id,
            content: message,
        })
    }

    async function emitTypingEvent(to) {
        if (isLocalTyping === true && to === true) {
            return debouncedOffTypingEvent()
        }

        await socket.emit("chat:state:typing", {
            to_user_id: to_user_id,
            is_typing: to,
        })

        setIsLocalTyping(to)
    }

    async function debouncedOffTypingEvent() {
        if (timeoutOffTypingEvent) {
            clearTimeout(timeoutOffTypingEvent)
        }

        setTimeoutOffTypingEvent(setTimeout(() => {
            emitTypingEvent(false)
        }, 5000))
    }

    const listenEvents = {
        "chat:receive:message": (message) => {
            setMessages((messages) => {
                return [
                    ...messages,
                    message
                ]
            })
        },
        "chat:state:typing": (state) => {
            setIsRemoteTyping(state.is_typing)
        },
    }

    React.useEffect(() => {
        if (scroller?.current) {
            const paddingBottom = scroller.current.style.paddingBottom.replace("px", "")

            scroller.current?.scrollTo({
                top: scroller.current.scrollHeight + paddingBottom,
                behavior: "smooth",
            })
        }
    }, [messages])

    React.useEffect(() => {
        const targetSocket = app.cores.api.client().sockets.chats

        setSocket(targetSocket)

        for (const [event, handler] of Object.entries(listenEvents)) {
            targetSocket.on(event, handler)
        }

        return () => {
            for (const [event, handler] of Object.entries(listenEvents)) {
                targetSocket.off(event, handler)
            }

            if (timeoutOffTypingEvent) {
                clearTimeout(timeoutOffTypingEvent)
            }
        }
    }, [])

    return {
        sendMessage,
        messages,
        setMessages,
        setScroller,
        emitTypingEvent,
        isRemoteTyping,
    }
}