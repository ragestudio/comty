import React from "react"
import * as antd from "antd"
import Plyr from "plyr-react"

import { processString } from "utils"

import { Icons } from "components/Icons"

import PostAttachments from "../attachments"

import "./index.less"

export default React.memo((props) => {
    let { message, attachments, type, data, flags } = props.data

    const [nsfwAccepted, setNsfwAccepted] = React.useState(false)

    const isNSFW = flags?.includes("nsfw")

    if (typeof data === "string") {
        try {
            data = JSON.parse(data)
        } catch (error) {
            console.error(error)
            data = {}
        }
    }

    const onClickPlaylist = () => {
        if (data.playlist) {
            app.AudioPlayer.startPlaylist(data.playlist)
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

    const renderContent = () => {
        switch (type) {
            case "playlist": {
                return <>
                    <div
                        className="playlistCover"
                        onClick={onClickPlaylist}
                        style={{
                            backgroundImage: `url(${data?.cover ?? "/assets/no_song.png"})`,
                        }}
                    />

                    <div className="playlistTitle">
                        <div>
                            <h1>
                                {data.title ?? "Untitled Playlist"}
                            </h1>
                            <h3>
                                {data.artist}
                            </h3>
                        </div>

                        <h4>
                            {message}
                        </h4>

                        <div className="actions">
                            <antd.Button onClick={onClickPlaylist}>
                                <Icons.PlayCircle />
                                Play
                            </antd.Button>
                        </div>
                    </div>
                </>
            }
            default: {
                return <>
                    <div className="message">
                        {message}
                    </div>

                    {attachments.length > 0 && <PostAttachments attachments={attachments} />}
                </>
            }
        }
    }

    return <div
        className="post_content"
    >
        {isNSFW && !nsfwAccepted &&
            <div className="nsfw_alert">
                <h2>
                    This post may contain sensitive content.
                </h2>

                <antd.Button onClick={() => setNsfwAccepted(true)}>
                    Show anyways
                </antd.Button>
            </div>
        }

        {renderContent()}
    </div>
})