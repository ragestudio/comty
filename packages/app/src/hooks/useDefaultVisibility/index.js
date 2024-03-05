import React from "react"

export default (defaultValue) => {
    const [visible, setVisible] = React.useState(defaultValue ?? false)

    React.useEffect(() => {
        setTimeout(() => {
            setVisible(true)
        }, 10)
    }, [])

    return [visible, setVisible]
}