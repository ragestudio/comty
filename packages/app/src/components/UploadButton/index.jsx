import React from "react"
import { Upload, Progress } from "antd"
import classnames from "classnames"

import { Icons } from "@components/Icons"

import "./index.less"

export default (props) => {
    const [uploading, setUploading] = React.useState(false)
    const [progess, setProgess] = React.useState(null)

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
        setProgess(1)

        handleOnStart(req.file.uid, req.file)

        await app.cores.remoteStorage.uploadFile(req.file, {
            onProgress: (file, progress) => {
                setProgess(progress)
                handleOnProgress(file.uid, progress)
            },
            onError: (file, error) => {
                setProgess(null)
                handleOnError(file.uid, error)
                setUploading(false)
            },
            onFinish: (file, response) => {
                if (typeof props.ctx?.onUpdateItem === "function") {
                    props.ctx.onUpdateItem(response.url)
                }

                if (typeof props.onUploadDone === "function") {
                    props.onUploadDone(response)
                }

                setUploading(false)
                handleOnSuccess(req.file.uid, response)

                setTimeout(() => {
                    setProgess(null)
                }, 1000)
            },
        })
    }

    return <Upload
        customRequest={handleUpload}
        multiple={
            props.multiple ?? false
        }
        accept={
            props.accept ?? [
                "image/*",
                "video/*",
                "audio/*",
            ]
        }
        progress={false}
        fileList={[]}
        className={classnames(
            "uploadButton",
            {
                ["uploading"]: !!progess || uploading
            }
        )}
        disabled={uploading}
    >
        <div className="uploadButton-content">
            {
                !progess && (props.icon ?? <Icons.FiUpload
                    style={{
                        margin: 0
                    }}
                />)
            }

            {
                progess && <Progress
                    type="circle"
                    percent={progess}
                    strokeWidth={20}
                    format={() => null}
                />
            }

            {
                props.children ?? "Upload"
            }
        </div>
    </Upload>
}