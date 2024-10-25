import React from "react"
import * as antd from "antd"

import Image from "@components/Image"
import UploadButton from "@components/UploadButton"

import "./index.less"

const CoverEditor = (props) => {
    const { value, onChange, defaultUrl } = props

    const [init, setInit] = React.useState(true)
    const [url, setUrl] = React.useState(value)

    React.useEffect(() => {
        if (!init) {
            onChange(url)
        }
    }, [url])

    React.useEffect(() => {
        if (!value) {
            setUrl(defaultUrl)
        } else {
            setUrl(value)
        }

        setInit(false)
    }, [])

    return <div className="cover-editor">
        <div className="cover-editor-preview">
            <Image
                src={url}
            />
        </div>

        <div className="cover-editor-actions">
            <UploadButton
                onSuccess={(uid, response) => {
                    setUrl(response.url)
                }}
            />

            <antd.Button
                type="primary"
                onClick={() => {
                    setUrl(defaultUrl)
                }}
            >
                Reset
            </antd.Button>

            {
                props.extraActions
            }
        </div>
    </div>
}

export default CoverEditor
