import React from "react"
import Lottie from "lottie-react"
import classnames from "classnames"

import "./index.less"

function animationFetcher(url) {
    return fetch(url)
        .then((res) => res.json())
}

export default ({
    animation,
    src,
    loop = false,
    className = [],
}) => {
    const [animationData, setAnimationData] = React.useState(animation)

    React.useEffect(() => {
        if (!animation) {
            animationFetcher(src)
                .then((animationData) => {
                    setAnimationData(animationData)
                })
        }
    }, [])

    if (!animationData) {
        return React.Fragment
    }

    return <Lottie
        className={classnames(
            "animation-player",
            ...className
        )}
        animationData={animationData}
        loop={loop}
    />
}