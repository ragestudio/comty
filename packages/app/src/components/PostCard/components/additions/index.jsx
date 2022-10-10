import React from "react"
import * as antd from "antd"
import loadable from "@loadable/component"

import { Icons } from "components/Icons"

import ContentFailed from "../contentFailed"

const mediaTypes = {
    "jpg": "image",
    "jpeg": "image",
    "png": "image",
    "gif": "image",
    "mp4": "video",
    "webm": "video",
    "ogv": "video",
    "mov": "video",
    "avi": "video",
    "mkv": "video",
    "ogg": "audio",
    "mp3": "audio",
    "wav": "audio",
    "flac": "audio",
    "aac": "audio",
    "m4a": "audio",
}

import "plyr-react/dist/plyr.css"
import "./index.less"

export default class PostAdditions extends React.PureComponent {
    getAdditions = (data) => {
        return data.map((addition, index) => {
            if (typeof addition === "string") {
                addition = {
                    url: addition,
                }
            }

            const { url, id, name } = addition

            const MediaRender = loadable(async () => {
                let extension = null

                try {
                    // get media type by parsing the url
                    const mediaTypeExt = /\.([a-zA-Z0-9]+)$/.exec(url)

                    if (mediaTypeExt) {
                        extension = mediaTypeExt[1]
                    } else {
                        // try to get media by creating requesting the url
                        const response = await fetch(url, {
                            method: "HEAD",
                        })

                        extension = response.headers.get("content-type").split("/")[1]
                    }

                    extension = extension.toLowerCase()

                    const mediaType = mediaTypes[extension]
                    const mimeType = `${mediaType}/${extension}`

                    if (!mediaType) {
                        return () => <ContentFailed />
                    }

                    switch (mediaType.split("/")[0]) {
                        case "image": {
                            return () => <img src={url} />
                        }
                        case "video": {
                            return () => <video controls>
                                <source src={url} type={mimeType} />
                            </video>
                        }
                        case "audio": {
                            return () => <audio controls>
                                <source src={url} type={mimeType} />
                            </audio>
                        }

                        default: {
                            return () => <h4>
                                Unsupported media type [{mediaType}/{mediaTypeExt}]
                            </h4>
                        }
                    }
                } catch (error) {
                    console.error(error)
                    return () => <ContentFailed />
                }
            })

            return <div key={index} className="addition">
                <React.Suspense fallback={<div>Loading</div>} >
                    <MediaRender />
                </React.Suspense>
            </div>
        })
    }

    render() {
        return <div className="post_additions">
            <antd.Carousel
                arrows={true}
                nextArrow={<Icons.ChevronRight />}
                prevArrow={<Icons.ChevronLeft />}
                autoplay={this.props.autoCarrousel}
            >
                {this.getAdditions(this.props.additions)}
            </antd.Carousel>
        </div>
    }
}