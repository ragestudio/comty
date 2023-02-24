import React from "react"
import { Button, Upload } from "antd"

import { Icons } from "components/Icons"

export default (props) => {
    const [uploading, setUploading] = React.useState(false)

    const handleUpload = async (req) => {
        setUploading(true)

        const formData = new FormData()

        formData.append("files", req.file)

        const response = await window.app.cores.api.customRequest("main", {
            url: "/upload",
            method: "POST",
            data: formData
        }).catch((error) => {
            console.error(error)
            app.message.error(error.respose.data.message)

            return false
        })

        if (response) {
            // check failed uploads
            if (response.data.failed.length > 0) {
                app.notification.new({
                    message: "Could not upload files",
                    description: () => {
                        return response.data.failed.map((fail) => {
                            return <div
                                style={{
                                    marginBottom: 5
                                }}
                            >
                                <b>[{fail.fileName}]</b> - {fail.error}
                            </div>
                        })
                    }
                }, {
                    type: "error"
                })
            }

            if (response.data.files.length > 0) {
                if (typeof props.onUploadDone === "function") {
                    if (props.multiple) {
                        await props.onUploadDone(response.data.files)
                    } else {
                        await props.onUploadDone(response.data.files[0])
                    }
                }
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