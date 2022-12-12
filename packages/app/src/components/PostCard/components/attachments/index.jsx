import React from "react"
import { Skeleton } from "antd"
import loadable from "@loadable/component"
import { Carousel } from "react-responsive-carousel"
import Plyr from "plyr-react"

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

import "react-responsive-carousel/lib/styles/carousel.min.css"
import "plyr-react/dist/plyr.css"
import "./index.less"

const Attachment = React.memo((props) => {
    const { url, id, name } = props.attachment

    const [loaded, setLoaded] = React.useState(false)

    const [mediaType, setMediaType] = React.useState(null)
    const [mimeType, setMimeType] = React.useState(null)

    const getMediaType = async () => {
        let extension = null

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

        setMediaType(mediaType)
        setMimeType(mimeType)

        setLoaded(true)
    }

    const renderMedia = () => {
        switch (mediaType.split("/")[0]) {
            case "image": {
                return <img src={url} />
            }
            case "video": {
                return <Plyr
                    source={{
                        type: "video",
                        sources: [{
                            src: url,
                        }],
                    }}
                    options={{
                        controls: ["play", "progress", "current-time", "mute", "volume"],
                    }}
                />
            }
            case "audio": {
                return <audio controls>
                    <source src={url} type={mimeType} />
                </audio>
            }
            default: {
                return <h4>
                    Unsupported media type [{mediaType}/{mediaTypeExt}]
                </h4>
            }
        }
    }

    React.useEffect(() => {
        getMediaType()
    }, [])

    if (!loaded) {
        return <Skeleton active />
    }

    if (loaded && !mediaType && !mimeType) {
        return <ContentFailed />
    }

    return <div className="attachment" id={id}>
        {renderMedia()}
    </div>
})

export default (props) => {
    const carouselRef = React.useRef(null)
    const [attachmentIndex, setAttachmentIndex] = React.useState(0)

    const handleAttachmentChange = (index) => {
        const currentAttachmentIndex = carouselRef.current.state.selectedItem
        const currentAttachment = carouselRef.current.itemsRef[currentAttachmentIndex].querySelector("video, audio")

        if (currentAttachmentIndex !== index) {
            // if the attachment is a video, pause it
            if (currentAttachment) {
                currentAttachment.pause()
            }
        } else {
            // else if the attachment is a video, play it
            if (currentAttachment) {
                currentAttachment.play()
            }
        }

        setAttachmentIndex(index)
    }

    React.useEffect(() => {
        // get attachment index from query string
        const attachmentIndex = parseInt(new URLSearchParams(window.location.search).get("attachment"))

        if (attachmentIndex) {
            setAttachmentIndex(attachmentIndex)
        }
    }, [])

    return <div className="post_attachments">
        <Carousel
            ref={carouselRef}
            showArrows={true}
            showStatus={false}
            showThumbs={false}
            showIndicators={props.attachments?.length > 1 ?? false}
            selectedItem={attachmentIndex}
            onChange={handleAttachmentChange}
            transitionTime={150}
            stopOnHover={true}
        >
            {
                props.attachments.map((attachment, index) => {
                    return <Attachment key={index} attachment={attachment} />
                })
            }
        </Carousel>
    </div>
}