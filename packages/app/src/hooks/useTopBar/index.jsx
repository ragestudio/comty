import React from "react"

export default (props) => {
    app.layout.top_bar.render(
        <React.Fragment>
            {props.children}
        </React.Fragment>,
        props.options)

    React.useEffect(() => {
        return () => {
            app.layout.top_bar.renderDefault()
        }
    }, [])

    return null
}