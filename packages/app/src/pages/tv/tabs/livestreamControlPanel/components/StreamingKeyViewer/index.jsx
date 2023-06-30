import React from "react"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const [streamingKeyVisibility, setStreamingKeyVisibility] = React.useState(false)

    const toggleVisibility = (to) => {
        setStreamingKeyVisibility(to ?? !streamingKeyVisibility)
    }

    return <div className="streamingKeyString">
        {streamingKeyVisibility ?
            <>
                <Icons.EyeOff onClick={() => toggleVisibility()} />
                <code>
                    {props.streamingKey ?? "No streaming key available"}
                </code>
            </> :
            <div
                onClick={() => toggleVisibility()}
            >
                <Icons.Eye />
                Click to show key
            </div>
        }
    </div>
}
