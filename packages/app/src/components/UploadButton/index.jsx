import React from "react"
import { Button, Upload } from "antd"

import { Icons } from "components/Icons"

export default (props) => {
    const [uploading, setUploading] = React.useState(false)

    const handleUpload = async (req) => {
        setUploading(true)

        const response = await app.cores.remoteStorage.uploadFile(req.file).catch((err) => {
            app.notification.new({
                message: "Could not upload file",
                description: err.message
            }, {
                type: "error"
            })
        })

        if (typeof props.ctx?.onUpdateItem === "function") {
            props.ctx.onUpdateItem(response.url)
        }

        if (typeof props.onUploadDone === "function") {
            if (props.multiple) {
                await props.onUploadDone(response)
            } else {
                await props.onUploadDone(response)
            }
        }

        setUploading(false)
    }

    return <Upload
        customRequest={handleUpload}
        multiple={
            props.multiple ?? false
        }
        accept={
            props.accept ?? "image/*"
        }
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