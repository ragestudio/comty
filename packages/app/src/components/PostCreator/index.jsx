import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import { User } from "models"
import classnames from "classnames"
import { PostAdditions } from "components/PostCard"

import "./index.less"

// TODO: Fetch `maxMessageLength` value from server API
const maxMessageLength = 512

export default (props) => {
    const api = window.app.request

    const [loading, setLoading] = React.useState(false)
    const [uploaderVisible, setUploaderVisible] = React.useState(false)
    const [focused, setFocused] = React.useState(false)

    const [userData, setUserData] = React.useState(null)
    const [postData, setPostData] = React.useState({
        message: "",
        additions: []
    })

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
        setLoading(true)
        setUploaderVisible(false)
        setFocused(false)
        
        const response = api.put.post({ ...postData }).catch(error => {
            console.error(error)
            antd.message.error(error)

            return false
        })

        setLoading(false)

        if (response) {
            cleanPostData()
        }
    }

    const onUploadFile = async (req) => {
        // get file data
        const file = req.file

        // append to form data
        const formData = new FormData()
        formData.append("files", file)

        setLoading(true)

        // send request
        const request = await api.post.upload(formData, undefined).catch((error) => {
            console.error(error)
            antd.message.error(error)

            req.onError(error)

            return false
        })

        setLoading(false)

        if (request) {
            return req.onSuccess(request)
        }
    }

    const canPublish = () => {
        const messageLengthValid = postData.message.length !== 0 && postData.message.length < maxMessageLength

        return Boolean(messageLengthValid)
    }

    const onDraggerChange = (change) => {
        console.log(change)

        switch (change.file.status) {
            case "done": {
                let additions = postData.additions ?? []

                additions.push(...change.file.response)

                return updatePostData({ additions })
            }

            default: {
                break
            }
        }
    }

    const onChangeMessageInput = (event) => {
        console.log(event.target.value)

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

    React.useEffect(() => {
        User.data().then(user => {
            setUserData(user)
        })
    }, [])

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
                <img src={userData?.avatar} />
            </div>
            <antd.Input.TextArea
                disabled={loading}
                value={postData.message}
                onPressEnter={submit}
                autoSize={{ minRows: 3, maxRows: 6 }}
                dragable="false"
                placeholder="What are you thinking?"
                onChange={onChangeMessageInput}
                allowClear
                rows={8}
                maxLength={maxMessageLength}
            />
            <div>
                <antd.Button
                    type="primary"
                    disabled={loading || !canPublish()}
                    onClick={submit}
                    icon={loading ? <Icons.LoadingOutlined spin /> : <Icons.Send />}
                />
            </div>
        </div>

        {postData.additions.length > 0 && <PostAdditions additions={postData.additions} />}

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
                multiple={true}
                onChange={onDraggerChange}
                customRequest={onUploadFile}
            >
                <p >Click or drag file to this area to upload</p>
            </antd.Upload.Dragger>
        </div>
    </div>
}