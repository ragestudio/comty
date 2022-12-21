import React from "react"
import { Button, Input, Upload } from "antd"
import { Icons } from "components/Icons"

import "./index.less"

export default (props) => {
    const [value, setValue] = React.useState(props.ctx.currentValue)
    const [uploading, setUploading] = React.useState(false)

    const uploadImage = async (req) => {
        setUploading(true)

        const formData = new FormData()

        formData.append("files", req.file)

        const request = await window.app.api.withEndpoints("main").post.upload(formData, undefined).catch((error) => {
            console.error(error)
            app.message.error(error)

            return false
        })

        setUploading(false)

        if (request) {
            setValue(request.files[0].url)
            props.ctx.dispatchUpdate(request.files[0].url)
        }
    }

    return <div className="imageUploader">
        {
            !props.noPreview && value && <div className="uploadPreview">
                <img src={value} />
            </div>
        }

        <Input.Group compact>
            <Input
                placeholder="Image URL..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onPressEnter={() => props.ctx.dispatchUpdate(value)}
            />

            <Button
                icon={<Icons.Save />}
                onClick={() => props.ctx.dispatchUpdate(value)}
            />
        </Input.Group>

        or

        <Upload
            customRequest={uploadImage}
            multiple={false}
            accept="image/*"
            progress={false}
            fileList={[]}
        >
            <Button
                icon={<Icons.Upload />}
                loading={uploading}
            >
                Upload
            </Button>
        </Upload>
    </div>
}