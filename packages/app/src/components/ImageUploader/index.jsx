import React from "react"
import { Icons } from "components/Icons"
import * as antd from "antd"
import { getBase64 } from "utils"

export default class ImageUploader extends React.Component {
    state = {
        previewVisible: false,
        previewImage: "",
        previewTitle: "",
        fileList: [],
        urlList: [],
    }

    api = window.app.api.withEndpoints("main")

    handleChange = ({ fileList }) => {
        this.setState({ fileList })

        if (typeof this.props.onChange === "function") {
            this.props.onChange(fileList)
        }
    }

    handleCancel = () => this.setState({ previewVisible: false })

    handlePreview = async file => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj)
        }

        this.setState({
            previewImage: file.url || file.preview,
            previewVisible: true,
            previewTitle: file.name || file.url.substring(file.url.lastIndexOf("/") + 1),
        })
    }

    handleUploadRequest = async (req) => {
        if (typeof this.props.onUpload === "function") {
            this.props.onUpload(req)
        } else {
            const payloadData = new FormData()
            payloadData.append(req.file.name, req.file)

            const result = await this.api.post.upload(payloadData).catch(() => {
                req.onError("Error uploading image")
                return false
            })

            if (result) {
                req.onSuccess()
                await this.setState({ urlList: [...this.state.urlList, ...result.urls] })
            }

            if (typeof this.props.onUploadDone === "function") {
                await this.props.onUploadDone(this.state.urlList)
            }

            return result.urls
        }
    }

    render() {
        const uploadButton = (<div>
            <Icons.Plus />
            <div style={{ marginTop: 8 }}>Upload</div>
        </div>)

        return <div>
            <antd.Upload
                listType="picture-card"
                fileList={this.state.fileList}
                onPreview={this.handlePreview}
                onChange={this.handleChange}
                customRequest={this.handleUploadRequest}
            >
                {this.state.fileList.length >= 8 ? null : uploadButton}
            </antd.Upload>
            <antd.Modal
                visible={this.state.previewVisible}
                title={this.state.previewTitle}
                footer={null}
                onCancel={this.handleCancel}
            >
                <img style={{ width: "100%" }} src={this.state.previewImage} />
            </antd.Modal>
        </div>
    }
}