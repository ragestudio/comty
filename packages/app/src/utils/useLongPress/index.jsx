import { useCallback, useRef, useState } from "react"

export default (
    onLongPress,
    onClick,
    {
        shouldPreventDefault = true,
        delay = 300,
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
                onLongPress(event)
                setLongPressTriggered(true)
            }, delay)
        },
        [onLongPress, delay, shouldPreventDefault]
    )

    const clear = useCallback(
        (event, shouldTriggerClick = true) => {
            timeout.current && clearTimeout(timeout.current)
            shouldTriggerClick && !longPressTriggered && onClick()
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