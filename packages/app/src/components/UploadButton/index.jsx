import React from "react"
import { Button, Upload } from "antd"

import { Icons } from "components/Icons"

export default (props) => {
    const [uploading, setUploading] = React.useState(false)

    const handleOnStart = (file_uid, file) => {
        if (typeof props.onStart === "function") {
            props.onStart(file_uid, file)
        }
    }

    const handleOnProgress = (file_uid, progress) => {
        if (typeof props.onProgress === "function") {
            props.onProgress(file_uid, progress)
        }
    }

    const handleOnError = (file_uid, error) => {
        if (typeof props.onError === "function") {
            props.onError(file_uid, error)
        }
    }

    const handleOnSuccess = (file_uid, response) => {
        if (typeof props.onSuccess === "function") {
            props.onSuccess(file_uid, response)
        }
    }

    const handleUpload = async (req) => {
        setUploading(true)

        handleOnStart(req.file.uid, req.file)

        const response = await app.cores.remoteStorage.uploadFile(req.file, {
            onProgress: (file, progress) => {
                return handleOnProgress(file.uid, progress)
            }
        }).catch((err) => {
            app.notification.new({
                title: "Could not upload file",
                description: err
            }, {
                type: "error"
            })

            return handleOnError(req.file.uid, err)
        })

        if (typeof props.ctx?.onUpdateItem === "function") {
            props.ctx.onUpdateItem(response.url)
        }

        if (typeof props.onUploadDone === "function") {
            await props.onUploadDone(response)
        }

        setUploading(false)

        return handleOnSuccess(req.file.uid, response)
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