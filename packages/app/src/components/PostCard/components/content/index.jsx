import React from "react"
import * as antd from "antd"
import Plyr from "plyr-react"
import classnames from "classnames"

import { processString } from "utils"

import "./index.less"

export default (props) => {
    let { message, data } = props.data

    const [nsfwAccepted, setNsfwAccepted] = React.useState(false)

    if (typeof data === "string") {
        try {
            data = JSON.parse(data)
        } catch (error) {
            console.error(error)
            data = {}
        }
    }

    // parse message
    const regexs = [
        {
            regex: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(&[a-zA-Z0-9_-]+=[a-zA-Z0-9_-]+)*/g,
            fn: (key, result) => {
                return <Plyr source={{
                    type: "video",
                    sources: [{
                        src: result[1],
                        provider: "youtube",
                    }],
                }} />
            }
        },
        {
            regex: /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi,
            fn: (key, result) => {
                return <a key={key} href={result[1]} target="_blank" rel="noopener noreferrer">{result[1]}</a>
            }
        },
        {
            regex: /(@[a-zA-Z0-9_]+)/gi,
            fn: (key, result) => {
                return <a key={key} onClick={() => window.app.setLocation(`/@${result[1].substr(1)}`)}>{result[1]}</a>
            }
        },
    ]

    message = processString(regexs)(message)

    return <div
        className={
            classnames(
                "post_content",
                {
                    ["nsfw"]: props.nsfw && !nsfwAccepted
                }
            )
        }
    >
        {props.nsfw && !nsfwAccepted &&
            <div className="nsfw_alert">
                <h2>
                    This post may contain sensitive content.
                </h2>

                <antd.Button onClick={() => setNsfwAccepted(true)}>
                    Show anyways
                </antd.Button>
            </div>
        }

        <div className="message">
            {message}
        </div>

        {
            props.children
        }
    </div>
}