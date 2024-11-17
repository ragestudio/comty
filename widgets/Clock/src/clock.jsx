import React from "react"

import "./index.less"

const Clock = () => {
    const [time, setTime] = React.useState(new Date())

    React.useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date())
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return <div className="clock">
        {time.toLocaleTimeString()}
    </div>
}

export default Clock