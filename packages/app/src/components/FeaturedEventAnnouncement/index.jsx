import React from "react"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const { backgroundImg, backgroundStyle, logoImg, title, description } = props.data ?? {}

    return <div
        key={props.index}
        className="featuredEvent"
        style={{
            backgroundImage: `url(${backgroundImg})`,
            ...backgroundStyle
        }}
    >
        <div className="indicator">
            <Icons.Target /> <span>Featured event</span>
        </div>
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
}