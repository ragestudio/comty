import React from "react"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const [streamingKeyVisibility, setStreamingKeyVisibility] = React.useState(false)

    const toogleVisibility = (to) => {
        setStreamingKeyVisibility(to ?? !streamingKeyVisibility)
    }

    return <div className="streamingKeyString">
        {streamingKeyVisibility ?
            <>
                <Icons.EyeOff onClick={() => toogleVisibility()} />
                <code>
                    {props.streamingKey ?? "No streaming key available"}
                </code>
            </> :
            <div
                onClick={() => toogleVisibility()}
            >
                <Icons.Eye />
                Click to show key
            </div>
        }
    </div>
}
