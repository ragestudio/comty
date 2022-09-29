import React from "react"
import * as antd from "antd"

import { Icons } from "components/Icons"

import "./index.less"

const UploadHint = (props) => {
    return <div className="uploadHint">
        <Icons.MdPlaylistAdd />
        <p>Upload your tracks</p>
        <p>Drag and drop your tracks here or click this box to start uploading files.</p>
    </div>
}

// TODO: Handle `cntr+v` to paste data from the clipboard to the post additions
// TODO: Send file deletion request to the server when user removes file from the list
// TODO: Make cover preview style more beautiful (E.G. Use the entire div as background)
// TODO: Make files list item can be dragged to change their order
// TODO: Make files can be modified (E.G. Change cover, change title, change artist, etc.)

export default (props) => {
    const api = app.api.withEndpoints("main")

    const [playlistName, setPlaylistName] = React.useState(null)
    const [playlistDescription, setPlaylistDescription] = React.useState(null)
    const [playlistArtist, setPlaylistArtist] = React.useState(null)
    const [coverURL, setCoverURL] = React.useState(null)
    const [fileList, setFileList] = React.useState([])

    const [pending, setPending] = React.useState([])
    const [loading, setLoading] = React.useState(false)

    const handleTitleOnChange = (event) => {
        const value = event.target.value

        if (value === "") {
            return setPlaylistName(null)
        }

        return setPlaylistName(event.target.value)
    }

    const handleDescriptionOnChange = (event) => {
        const value = event.target.value

        if (value === "") {
            return setPlaylistDescription(null)
        }

        return setPlaylistDescription(event.target.value)
    }

    const handleArtistOnChange = (event) => {
        const value = event.target.value

        if (value === "") {
            return setPlaylistArtist(null)
        }

        return setPlaylistArtist(event.target.value)
    }

    const handleUploaderOnChange = (change) => {
        switch (change.file.status) {
            case "uploading": {
                setPending([...pending, change.file.uid])
                break
            }
            case "done": {
                const recivedFiles = []

                // remove pending file
                setPending(pending.filter(uid => uid !== change.file.uid))

                // push to file list
                if (Array.isArray(change.file.response)) {
                    recivedFiles.push(...change.file.response)
                } else {
                    recivedFiles.push(change.file.response)
                }

                // add uid to files
                recivedFiles.forEach((file) => {
                    file.uid = change.file.uid
                })

                setFileList([...fileList, ...recivedFiles])

                break
            }
            case "removed": {
                // remove from file list
                setFileList(fileList.filter(file => file.uid !== change.file.uid))
            }

            default: {
                break
            }
        }
    }

    const handleCoverUploaderOnChange = (change) => {
        switch (change.file.status) {
            case "uploading": {
                setPending([...pending, change.file.uid])
                break
            }
            case "done": {
                // remove pending file
                setPending(pending.filter(uid => uid !== change.file.uid))

                setCoverURL(change.file.response[0].url)

                break
            }
            case "removed": {
                setCoverURL(null)
            }

            default: {
                break
            }
        }
    }

    const handleUpload = async (req) => {
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

    const checkCanSubmit = () => {
        const nameValid = playlistName !== null && playlistName.length !== 0
        const filesListValid = fileList.length !== 0
        const isPending = pending.length !== 0

        return nameValid && filesListValid && !isPending
    }

    const handleSubmit = async () => {
        setLoading(true)

        let RequestData = {
            type: "playlist",
            message: playlistDescription,
            data: {
                title: playlistName,
                cover: coverURL,
                artist: playlistArtist,
                playlist: fileList.map((file) => {
                    return {
                        title: file.name,
                        cover: file.cover ?? coverURL,
                        artist: file.artist ?? "Unknown",
                        src: file.url,
                    }
                })
            }
        }

        const response = api.post.post(RequestData).catch(error => {
            console.error(error)
            antd.message.error(error)

            return false
        })

        setLoading(false)

        if (response) {
            if (typeof props.close === "function") {
                props.close()
            }
        }
    }

    return <div className="content">
        <div className="playlistCreator">
            <div className="inputField">
                <Icons.MdOutlineMusicNote />
                <antd.Input
                    className="inputText"
                    placeholder="Playlist Title"
                    size="large"
                    bordered={false}
                    onChange={handleTitleOnChange}
                    maxLength={120}
                    value={playlistName}
                />
            </div>
            <div className="inputField">
                <Icons.MdOutlineDescription />
                <antd.Input
                    className="inputText"
                    placeholder="Description"
                    bordered={false}
                    onChange={handleDescriptionOnChange}
                    maxLength={2500}
                    value={playlistDescription}
                />
            </div>
            <div className="inputField">
                <Icons.MdOutlinePersonOutline />
                <antd.Input
                    className="inputText"
                    placeholder="Artist"
                    bordered={false}
                    onChange={handleArtistOnChange}
                    maxLength={300}
                    value={playlistArtist}
                />
            </div>
            <div className="inputField">
                <Icons.MdImage />
                {
                    coverURL && <div className="coverPreview">
                        <img src={coverURL} alt="cover" />
                        <antd.Button
                            onClick={() => {
                                setCoverURL(null)
                            }}
                            icon={<Icons.MdClose />}
                            shape="round"
                        >
                            Remove Cover
                        </antd.Button>
                    </div>
                }
                {
                    !coverURL && <antd.Upload
                        className="coverUploader"
                        customRequest={handleUpload}
                        onChange={handleCoverUploaderOnChange}
                        accept="image/*"
                    >
                        <antd.Button icon={<Icons.MdImage />}>Upload cover</antd.Button>
                    </antd.Upload>
                }
            </div>

            <div className="files">
                <antd.Upload
                    className="uploader"
                    listType="picture"
                    customRequest={handleUpload}
                    onChange={handleUploaderOnChange}
                    accept="audio/*"
                    multiple
                >
                    {fileList.length === 0 ? <UploadHint /> : <antd.Button icon={<Icons.MdCloudUpload />}>
                        Upload files
                    </antd.Button>}
                </antd.Upload>
            </div>

            <div>
                <antd.Button
                    type="primary"
                    size="large"
                    disabled={!checkCanSubmit()}
                    icon={<Icons.MdCampaign />}
                    loading={loading}
                    onClick={handleSubmit}
                >
                    Publish
                </antd.Button>
            </div>

            <div className="footer">
                <p>
                    Uploading files that are not permitted by our <a onClick={() => app.setLocation("/terms")}>Terms of Service</a> may result in your account being suspended.
                </p>
            </div>
        </div>
    </div>
}