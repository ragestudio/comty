import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"
import UploadButton from "@components/UploadButton"

export default (props) => {
    const [releaseName, setReleaseName] = React.useState(props.release.title)
    const [releaseDescription, setReleaseDescription] = React.useState(props.release.description)
    const [releaseThumbnail, setReleaseThumbnail] = React.useState(props.release.cover ?? props.release.thumbnail)
    const [releaseVisibility, setReleaseVisibility] = React.useState(props.release.visibility)
    const [releaseType, setReleaseType] = React.useState(props.release.type)

    const handleReleaseTypeChange = (value) => {
        setReleaseType(value)

        props.onValueChange("type", value)
    }

    const handleTitleOnChange = (event) => {
        setReleaseName(event.target.value)

        props.onValueChange("title", event.target.value)
    }

    const handleDescriptionOnChange = (event) => {
        setReleaseDescription(event.target.value)

        props.onValueChange("description", event.target.value)
    }

    const handleCoverChange = (file) => {
        setReleaseThumbnail(file.url)

        props.onValueChange("cover", file.url)
    }

    const handleRemoveCover = () => {
        setReleaseThumbnail(null)

        props.onValueChange("cover", null)
    }

    const handleVisibilityChange = (value) => {
        setReleaseVisibility(value)

        props.onValueChange("public", value === "public")
    }

    return <div className="playlistCreator_layout_row">
        <div
            className="playlistCreator_layout_column"
        >
            <div className="field">
                <div className="field_header">
                    <Icons.MdOutlineMusicNote />
                    <span>Title</span>
                </div>

                <antd.Input
                    className="inputText"
                    placeholder="Publish Title"
                    size="large"
                    bordered={false}
                    value={releaseName}
                    onChange={handleTitleOnChange}
                    maxLength={120}
                />
            </div>

            <div className="field">
                <div className="field_header">
                    <Icons.MdOutlineDescription />
                    <span>Description</span>
                </div>

                <antd.Input.TextArea
                    className="inputText"
                    placeholder="Description (Support Markdown)"
                    bordered={false}
                    value={releaseDescription}
                    onChange={handleDescriptionOnChange}
                    maxLength={2500}
                    rows={4}
                />
            </div>

            <antd.Divider />

            <div className="field">
                <div className="field_header">
                    <Icons.IoMdRecording />
                    <span>Type</span>
                </div>

                <antd.Select
                    value={releaseType}
                    onChange={handleReleaseTypeChange}
                    defaultValue="album"
                >
                    <antd.Select.Option value="album">Album</antd.Select.Option>
                    <antd.Select.Option value="ep">EP</antd.Select.Option>
                    <antd.Select.Option value="single">Single</antd.Select.Option>
                </antd.Select>
            </div>

            <div className="field">
                <div className="field_header">
                    <Icons.Eye />
                    <span>Visibility</span>
                </div>

                <antd.Select
                    value={releaseVisibility}
                    onChange={handleVisibilityChange}
                    defaultValue={props.release.public ? "public" : "private"}
                >
                    <antd.Select.Option value="public">Public</antd.Select.Option>
                    <antd.Select.Option value="private">Private</antd.Select.Option>
                </antd.Select>
            </div>
        </div>

        <div
            className="playlistCreator_layout_column"
            style={{
                width: "50%",
                maxWidth: "300px"
            }}
        >
            <div className="field">
                <div className="field_header">
                    <Icons.MdImage />
                    <span>Cover</span>
                </div>

                <div className="coverPreview">
                    <div className="coverPreview_preview">
                        <img src={releaseThumbnail ?? "/assets/no_song.png"} alt="Thumbnail" />
                    </div>

                    <div className="coverPreview_actions">
                        <UploadButton
                            onUploadDone={handleCoverChange}
                            multiple={false}
                            accept="image/*"
                        >
                            Upload cover
                        </UploadButton>

                        <antd.Button
                            onClick={handleRemoveCover}
                            disabled={!releaseThumbnail}
                            icon={<Icons.MdClose />}
                            type="text"
                        >
                            Remove Cover
                        </antd.Button>
                    </div>
                </div>
            </div>

            <antd.Divider />

            <div className="field">
                {
                    props.release._id && <antd.Button
                        onClick={props.onDeletePlaylist}
                        icon={<Icons.MdDelete />}
                        danger
                    >
                        Delete Playlist
                    </antd.Button>
                }
            </div>
        </div>
    </div>
}
