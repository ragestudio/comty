import React from "react"
import { LazyLoadImage } from "react-lazy-load-image-component"

import "react-lazy-load-image-component/src/effects/blur.css"
import "./index.less"

export default (props) => {
    return <LazyLoadImage
        src={props.src}
        effect="blur"
        wrapperClassName="image-wrapper"
        onError={(e) => {
            e.target.src = "/broken-image.svg"
        }}
    />
}