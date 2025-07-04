import { useCallback, useRef, useState } from "react"

export default (
    onLongPress,
    onClick,
    {
        shouldPreventDefault = true,
        delay = app.cores.settings.get("longPressDelay") ?? 500,
        onTouchStart,
        onTouchEnd,
    } = {}
) => {
    const [longPressTriggered, setLongPressTriggered] = useState(false)
    const timeout = useRef()
    const target = useRef()

    const start = useCallback(
        event => {
            if (shouldPreventDefault && event.target) {
                event.target.addEventListener("touchend", preventDefault, {
                    passive: false
                })
                target.current = event.target
            }

            if (typeof onTouchStart === "function") {
                onTouchStart()
            }

            timeout.current = setTimeout(() => {
                if (typeof onLongPress === "function") {
                    onLongPress(event)
                }

                setLongPressTriggered(true)
            }, delay)
        },
        [onLongPress, delay, shouldPreventDefault]
    )

    const clear = useCallback((event, shouldTriggerClick = true) => {
        if (timeout.current) {
            clearTimeout(timeout.current)
        }

        if (shouldTriggerClick && !longPressTriggered && typeof onClick === "function") {
            onClick()
        }

        setLongPressTriggered(false)

        if (typeof onTouchEnd === "function") {
            onTouchEnd()
        }

        if (shouldPreventDefault && target.current) {
            target.current.removeEventListener("touchend", preventDefault)
        }
    },
        [shouldPreventDefault, onClick, longPressTriggered]
    )

    return {
        onMouseDown: e => start(e),
        onTouchStart: e => start(e),
        onMouseUp: e => clear(e),
        onMouseLeave: e => clear(e, false),
        onTouchEnd: e => clear(e)
    }
}

const isTouchEvent = event => {
    return "touches" in event
}

const preventDefault = event => {
    if (!isTouchEvent(event)) return

    if (event.touches.length < 2 && event.preventDefault) {
        event.preventDefault()
    }
}