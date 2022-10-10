import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import { User } from "models"

import { Icons } from "components/Icons"
import { PostAdditions } from "components/PostCard"

import "./index.less"

// TODO: Handle `cntr+v` to paste data from the clipboard to the post additions
// TODO: Fetch `maxMessageLength` value from server API
const maxMessageLength = 512

export default (props) => {
    const api = window.app.api.withEndpoints("main")

    const additionsRef = React.useRef(null)

    const [pending, setPending] = React.useState([])
    const [loading, setLoading] = React.useState(false)
    const [uploaderVisible, setUploaderVisible] = React.useState(false)
    const [focused, setFocused] = React.useState(false)

    const [postData, setPostData] = React.useState({
        message: "",
        additions: []
    })

    const [uploadPolicy, setUploadPolicy] = React.useState(null)

    const updatePostData = (update) => {
        setPostData({
            ...postData,
            ...update
        })
    }

    const cleanPostData = () => {
        setPostData({
            message: "",
            additions: []
        })
    }

    const submit = () => {
        if (!canSubmit()) return

        setLoading(true)
        setUploaderVisible(false)
        setFocused(false)

        const response = api.post.post({ ...postData }).catch(error => {
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

    const fetchUploadPolicy = () => {
        const policy = api.upload.policy().catch(error => {
            return false
        })

        if (policy) {
            setUploadPolicy(policy)
        }
    }

    const onUploadFile = async (req) => {
        // hide uploader
        setUploaderVisible(false)

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

    const canSubmit = () => {
        const messageLengthValid = postData.message.length !== 0 && postData.message.length < maxMessageLength

        return Boolean(messageLengthValid) && Boolean(pending.length === 0)
    }

    const removeAddition = (file_uid) => {
        updatePostData({
            additions: postData.additions.filter(addition => addition.file.uid !== file_uid)
        })
    }

    const onDraggerChange = (change) => {
        console.log(change)

        switch (change.file.status) {
            case "uploading": {
                setPending([...pending, change.file.uid])
                break
            }
            case "done": {
                let additions = postData.additions ?? []

                console.log(change.file)

                additions.push(...change.file.response)

                // remove pending file
                setPending(pending.filter(uid => uid !== change.file.uid))

                // update post data
                updatePostData({ additions })

                // force update additions
                if (additionsRef.current) {
                    additionsRef.current.forceUpdate()
                }

                break
            }
            case "error": {
                // remove pending file
                setPending(pending.filter(uid => uid !== change.file.uid))
            }
            default: {
                break
            }
        }
    }

    const onChangeMessageInput = (event) => {
        updatePostData({
            message: event.target.value
        })
    }

    const toggleUploader = (to) => {
        setUploaderVisible(to ?? !uploaderVisible)
    }

    const toggleFocus = (to) => {
        setFocused(to ?? !focused)
    }

    const handleKeyDown = (e) => {
        // detect if the user pressed `enter` key and submit the form, but only if the `shift` key is not pressed
        if (e.keyCode === 13 && !e.shiftKey) {
            e.preventDefault()
            e.stopPropagation()

            submit()
        }
    }

    React.useEffect(() => {
        fetchUploadPolicy()
    }, [])

    // set loading to true menwhile pending is not empty
    React.useEffect(() => {
        setLoading(pending.length !== 0)
    }, [pending])

    return <div
        className="postCreator"
        onDragOver={(e) => {
            e.preventDefault()
            toggleUploader(true)
        }}
        onDragLeave={(e) => {
            e.preventDefault()
            toggleUploader(false)
        }}
        onMouseEnter={() => {
            toggleFocus(true)
        }}
        onMouseLeave={() => {
            toggleFocus(false)
        }}
    >
        <div className="textInput">
            <div className="avatar">
                <img src={app.userData?.avatar} />
            </div>
            <antd.Input.TextArea
                placeholder="What are you thinking?"
                disabled={loading}
                onKeyDown={handleKeyDown}
                onChange={onChangeMessageInput}
                autoSize={{ minRows: 3, maxRows: 6 }}
                maxLength={maxMessageLength}
                dragable={false}
                value={postData.message}
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

        {postData.additions.length > 0 && <PostAdditions ref={additionsRef} additions={postData.additions} />}

        <div className={classnames("actions", { ["hided"]: !focused && !uploaderVisible })}>
            <div>
                <antd.Button
                    type={uploaderVisible ? "default" : "primary"}
                    disabled={loading}
                    onClick={() => {
                        toggleUploader()
                    }}
                    icon={<Icons.Upload />}
                />
            </div>
        </div>

        <div className={classnames("uploader", { ["hided"]: !uploaderVisible })}>
            <antd.Upload.Dragger
                maxCount={20}
                multiple={true}
                onChange={onDraggerChange}
                customRequest={onUploadFile}
            >
                <p >Click or drag file to this area to upload</p>
            </antd.Upload.Dragger>
        </div>
    </div>
}