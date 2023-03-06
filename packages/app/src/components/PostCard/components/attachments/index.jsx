import React from "react"
import { Skeleton } from "antd"
import { Carousel } from "react-responsive-carousel"
import { ImageViewer } from "components"
import Plyr from "plyr-react"
import mimetypes from "mime"

import ContentFailed from "../contentFailed"

import "react-responsive-carousel/lib/styles/carousel.min.css"
import "plyr-react/dist/plyr.css"
import "./index.less"

const Attachment = React.memo((props) => {
    const [loaded, setLoaded] = React.useState(false)

    const [mimeType, setMimeType] = React.useState(null)

    try {
        const { url, id } = props.attachment

        const onDoubleClickAttachment = (e) => {
            if (mimeType.split("/")[0] === "image") {
                e.preventDefault()
                e.stopPropagation()

                app.controls.openFullImageViewer(url)
            }
        }

        const getMediaType = async () => {
            let extension = null

            // get media type by parsing the url
            const mediaExtname = /\.([a-zA-Z0-9]+)$/.exec(url)

            if (mediaExtname) {
                extension = mediaExtname[1]
            } else {
                // try to get media by creating requesting the url
                const response = await fetch(url, {
                    method: "HEAD",
                })

                extension = response.headers.get("content-type").split("/")[1]
            }

            extension = extension.toLowerCase()

            if (!extension) {
                setLoaded(true)

                console.error("Failed to get media type", url, extension)

                return
            }

            const mimeType = mimetypes.getType(extension)

            setMimeType(mimeType)

            setLoaded(true)
        }

        const renderMedia = () => {
            if (!mimeType) {
                return null
            }

            switch (mimeType.split("/")[0]) {
                case "image": {
                    return <ImageViewer src={url} />
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
                        Unsupported media type [{mimeType}]
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

        if (loaded && !mimeType) {
            return <ContentFailed />
        }

        return <div
            key={props.index}
            id={id}
            className="attachment"
            onDoubleClick={onDoubleClickAttachment}
        >
            {renderMedia()}
        </div>
    } catch (error) {
        console.error(error)

        return <ContentFailed />
    }
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
                props.attachments?.length > 0 && props.attachments.map((attachment, index) => {
                    if (typeof attachment !== "object") {
                        return null
                    }

                    return <Attachment index={index} attachment={attachment} />
                })
            }
        </Carousel>
    </div>
}