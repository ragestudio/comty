import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { DateTime } from "luxon"
import humanSize from "@tsmx/human-readable"

import { Icons } from "components/Icons"

import PostModel from "models/post"

import "./index.less"

const DEFAULT_POST_POLICY = {
    maxMessageLength: 512,
    acceptedMimeTypes: ["image/gif", "image/png", "image/jpeg", "image/bmp"],
    maximumFileSize: 10 * 1024 * 1024,
    maximunFilesPerRequest: 10
}

export default (props) => {
    const api = window.app.cores.api.withEndpoints()

    const creatorRef = React.useRef(null)

    const [pending, setPending] = React.useState([])
    const [loading, setLoading] = React.useState(false)
    const [uploaderVisible, setUploaderVisible] = React.useState(false)

    const [postMessage, setPostMessage] = React.useState("")
    const [postAttachments, setPostAttachments] = React.useState([])
    const [fileList, setFileList] = React.useState([])

    const [postingPolicy, setPostingPolicy] = React.useState(DEFAULT_POST_POLICY)

    const cleanPostData = () => {
        setPostMessage("")
        setPostAttachments([])
        setFileList([])
    }

    const fetchUploadPolicy = async () => {
        const policy = await api.get.postingPolicy()

        setPostingPolicy(policy)
    }

    const canSubmit = () => {
        const messageLengthValid = postMessage.length !== 0 && postMessage.length < postingPolicy.maxMessageLength

        if (pending.length !== 0) {
            return false
        }

        if (!messageLengthValid && postAttachments.length === 0) {
            return false
        }

        return true
    }

    const submit = async () => {
        if (!canSubmit()) return

        setLoading(true)
        setUploaderVisible(false)

        const payload = {
            message: postMessage,
            attachments: postAttachments,
            timestamp: DateTime.local().toISO(),
        }

        const response = await PostModel.create(payload).catch(error => {
            console.error(error)
            antd.message.error(error)

            return false
        })

        setLoading(false)

        if (response) {
            cleanPostData()

            if (typeof props.onPost === "function") {
                props.onPost()
            }
        }
    }

    const onUploadFile = async (req) => {
        // hide uploader
        toogleUploaderVisibility(false)

        // get file data
        const file = req.file

        // append to form data
        const formData = new FormData()

        formData.append("files", file)

        // send request
        const request = await api.post.upload(formData, undefined).catch((error) => {
            console.error(error)
            antd.message.error(error)

            req.onError(error)

            return false
        })

        if (request) {
            return req.onSuccess(request)
        }
    }

    const removeAttachment = (file_uid) => {
        setPostAttachments(postAttachments.filter((file) => file.uid !== file_uid))
    }

    const addAttachment = (file) => {
        if (Array.isArray(file)) {
            return setPostAttachments([...postAttachments, ...file])
        }

        return setPostAttachments([...postAttachments, file])
    }

    const uploaderScrollToEnd = () => {
        // scroll to max right 
        const element = document.querySelector(".ant-upload-list-picture-card")

        // calculate the element's width and scroll to the end
        const scrollToLeft = element.scrollWidth - element.clientWidth

        if (element) {
            element.scrollTo({
                top: 0,
                left: scrollToLeft,
                behavior: "smooth",
            })
        }
    }

    const onUploaderChange = (change) => {
        setFileList(change.fileList)

        switch (change.file.status) {
            case "uploading": {
                toogleUploaderVisibility(false)

                setPending([...pending, change.file.uid])

                uploaderScrollToEnd()

                break
            }

            case "done": {
                // remove pending file
                setPending(pending.filter(uid => uid !== change.file.uid))

                // update post data
                addAttachment(change.file.response.files)

                // scroll to end
                uploaderScrollToEnd()

                break
            }
            case "error": {
                // remove pending file
                setPending(pending.filter(uid => uid !== change.file.uid))

                removeAttachment(change.file.uid)
            }
            default: {
                break
            }
        }
    }

    const onChangeMessageInput = (event) => {
        // if the fist character is a space or a whitespace remove it
        if (event.target.value[0] === " " || event.target.value[0] === "\n") {
            event.target.value = event.target.value.slice(1)
        }

        setPostMessage(event.target.value)
    }

    const toogleUploaderVisibility = (to) => {
        to = to ?? !uploaderVisible

        if (to === uploaderVisible) {
            return
        }

        setUploaderVisible(to ?? !uploaderVisible)
    }

    const handleKeyDown = (e) => {
        // detect if the user pressed `enter` key and submit the form, but only if the `shift` key is not pressed
        if (e.keyCode === 13 && !e.shiftKey) {
            e.preventDefault()
            e.stopPropagation()

            submit()
        }
    }

    const handlePaste = ({ clipboardData }) => {
        if (clipboardData && clipboardData.items.length > 0) {
            const isValidFormat = (fileType) => DEFAULT_ACCEPTED_FILES.includes(fileType)

            for (let index = 0; index < clipboardData.items.length; index++) {
                if (!isValidFormat(clipboardData.items[index].type)) {
                    throw new Error(`Sorry, that's not a format we support ${clipboardData.items[index].type}`)
                }

                let file = clipboardData.items[index].getAsFile()

                app.message.info("Uploading file...")

                file.thumbUrl = URL.createObjectURL(file)

                file.uid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

                // upload file
                onUploadFile({
                    file,
                    onSuccess: (response) => {
                        setFileList([...fileList, file])
                        addAttachment(response)
                    }
                })
            }
        }
    }

    const renderUploadPreviewItem = (item, file, list, actions) => {
        const uploading = file.status === "uploading"

        const onClickDelete = () => {
            actions.remove()
            removeAttachment(file.uid)
        }

        return <div className={classnames("file", { ["uploading"]: uploading })}>
            <div className="preview">
                <img src={file.thumbUrl ?? "/assets/new_file.png"} />
            </div>

            <div className="actions">
                {
                    uploading && <Icons.LoadingOutlined style={{ margin: "0 !important" }} />
                }
                {
                    !uploading && <antd.Button
                        type="link"
                        icon={<Icons.Trash />}
                        onClick={onClickDelete}
                    />
                }
            </div>
        </div>
    }

    const handleDrag = (event) => {
        event.preventDefault()
        event.stopPropagation()

        console.log(event)

        if (event.type === "dragenter") {
            toogleUploaderVisibility(true)
        } else if (event.type === "dragleave") {
            // check if mouse is over the uploader or outside the creatorRef
            if (uploaderVisible && !creatorRef.current.contains(event.target)) {
                toogleUploaderVisibility(false)
            }
        }
    }

    const handleUploadClick = () => {
        // create a new dialog
        const dialog = document.createElement("input")

        // set the dialog type to file
        dialog.type = "file"

        // set the dialog accept to the accepted files
        dialog.accept = postingPolicy.acceptedMimeTypes

        dialog.multiple = true

        // add a listener to the dialog
        dialog.addEventListener("change", (event) => {
            console.log(event)
        })

        // click the dialog
        dialog.click()
    }

    React.useEffect(() => {
        fetchUploadPolicy()

        document.addEventListener("paste", handlePaste)

        return () => {
            document.removeEventListener("paste", handlePaste)
        }
    }, [])

    // set loading to true menwhile pending is not empty
    React.useEffect(() => {
        setLoading(pending.length !== 0)
    }, [pending])

    return <div
        className={"postCreator"}
        ref={creatorRef}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
    >
        <div className="textInput">
            <div className="avatar">
                <img src={app.userData?.avatar} />
            </div>
            <antd.Input.TextArea
                placeholder="What are you thinking?"
                value={postMessage}
                autoSize={{ minRows: 3, maxRows: 6 }}
                maxLength={postingPolicy.maxMessageLength}
                onChange={onChangeMessageInput}
                onKeyDown={handleKeyDown}
                disabled={loading}
                draggable={false}
                allowClear
            />
            <div>
                <antd.Button
                    type="primary"
                    disabled={loading || !canSubmit()}
                    onClick={submit}
                    icon={loading ? <Icons.LoadingOutlined spin /> : <Icons.Send />}
                />
            </div>
        </div>

        <div className={classnames("uploader", { ["visible"]: uploaderVisible })}>
            <antd.Upload.Dragger
                openFileDialogOnClick={false}
                maxCount={postingPolicy.maximunFilesPerRequest}
                onChange={onUploaderChange}
                customRequest={onUploadFile}
                accept={postingPolicy.acceptedMimeTypes}
                fileList={fileList}
                listType="picture-card"
                itemRender={renderUploadPreviewItem}
                multiple
            >
                <div className="hint">
                    <h3>Drag and drop files here</h3>
                    <span>Max {humanSize.fromBytes(postingPolicy.maximumFileSize)}</span>
                </div>
            </antd.Upload.Dragger>
        </div>

        <div className="actions">
            <antd.Button
                type="primary"
                disabled={loading}
                onClick={handleUploadClick}
                icon={<Icons.Upload />}
            />

            <antd.Button
                type="primary"
                disabled={loading}
                icon={<Icons.MdPoll />}
            />

            <antd.Button
                type="primary"
                disabled={loading}
                icon={<Icons.MdPrivacyTip />}
            />
        </div>
    </div>
}


