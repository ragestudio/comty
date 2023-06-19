import React from "react"

import AnimationPlayer from "components/AnimationPlayer"

import StepsContext from "../../context"

export default (props) => {
    const context = React.useContext(StepsContext)

    React.useEffect(() => {
        setTimeout(() => {
            if (typeof context.onFinish === "function") {
                context.onFinish()
            }
        }, 2000)
    }, [])

    return <div className="tap-share-register_step centered">
        <AnimationPlayer
            src="https://assets10.lottiefiles.com/packages/lf20_dyy9le6w.json"
        />
        <h1>
            Your tag is ready to use!
        </h1>
    </div>
}