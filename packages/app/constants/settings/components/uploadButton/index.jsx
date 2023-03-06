import React from "react"
import { Button, Upload } from "antd"

import { Icons } from "components/Icons"

export default (props) => {
    const [uploading, setUploading] = React.useState(false)

    const handleUpload = async (req) => {
        console.log(req)

        setUploading(true)

        const formData = new FormData()

        formData.append("files", req.file)

        const { data } = await window.app.cores.api.customRequest({
            url: "/upload",
            method: "POST",
            data: formData
        }).catch((error) => {
            console.error(error)
            app.message.error(error.respose.data.message)

            return false
        })

        setUploading(false)

        if (data) {
            // check failed uploads
            if (data.failed.length > 0) {
                data.failed.forEach((file) => {
                    app.notification.error({
                        message: "Failed to upload file",
                        description: `Could not upload file ${file.fileName} cause > ${file.error}`
                    })
                })
            }

            props.ctx.dispatchUpdate(data.files[0].url)
        }
    }

    return <Upload
        customRequest={handleUpload}
        multiple={false}
        accept="image/*"
        progress={false}
        fileList={[]}
    >
        <Button
            icon={props.icon ?? <Icons.Upload
                style={{
                    margin: 0
                }}
            />}
            loading={uploading}
            type={
                props.type ?? "round"
            }
        >
            {
                props.children ?? "Upload"
            }
        </Button>
    </Upload>
}