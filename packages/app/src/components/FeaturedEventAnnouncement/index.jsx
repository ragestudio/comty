import React from "react"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const { backgroundImg, backgroundStyle, logoImg, title, description } = props.data?.announcement ?? {}

    const onClickEvent = () => {
        if (!props.data?._id) {
            console.error("No event ID provided")
            return false
        }

        app.location.push(`/featured-event/${props.data?._id}`)
    }

    return <div
        key={props.index}
        className="featuredEvent"
        style={{
            backgroundImage: `url(${backgroundImg})`,
            ...backgroundStyle
        }}
        onClick={onClickEvent}
    >
        <div className="featuredEvent_wrapper">
            <div className="logo">
                <img
                    src={logoImg}
                />
            </div>

            <div className="content">
                <h1>{title}</h1>
                <h3>{description}</h3>
            </div>
        </div>

        <div className="indicator">
            <Icons.Target /> <span>Featured event</span>
        </div>
    </div>
}