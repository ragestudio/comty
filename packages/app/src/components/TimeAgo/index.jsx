import React from "react"

import { DateTime } from "luxon"

const TimeAgo = (props) => {
    const [calculationInterval, setCalculationInterval] = React.useState(null)
    const [text, setText] = React.useState("")

    async function calculateRelative() {
        const timeAgo = DateTime.fromISO(
            props.time,
            {
                locale: app.cores.settings.get("language")
            }
        ).toRelative()

        setText(timeAgo)
    }

    React.useEffect(() => {
        setCalculationInterval(setInterval(calculateRelative, props.interval ?? 3000))

        calculateRelative()

        return () => {
            clearInterval(calculationInterval)
        }
    }, [])

    return text
}

export default TimeAgo