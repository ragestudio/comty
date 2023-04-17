import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"
import UploadButton from "components/UploadButton"

export default (props) => {
    const [playlistName, setPlaylistName] = React.useState(props.playlist.title)
    const [playlistDescription, setPlaylistDescription] = React.useState(props.playlist.description)
    const [playlistThumbnail, setPlaylistThumbnail] = React.useState(props.playlist.thumbnail)
    const [playlistVisibility, setPlaylistVisibility] = React.useState(props.playlist.visibility)

    const handleTitleOnChange = (event) => {
        setPlaylistName(event.target.value)

        props.onTitleChange(event.target.value)
    }

    const handleDescriptionOnChange = (event) => {
        setPlaylistDescription(event.target.value)

        props.onDescriptionChange(event.target.value)
    }

    const handleCoverChange = (file) => {
        setPlaylistThumbnail(file.url)

        props.onPlaylistCoverChange(file.url)
    }

    const handleRemoveCover = () => {
        setPlaylistThumbnail(null)

        props.onPlaylistCoverChange(null)
    }

    const handleVisibilityChange = (value) => {
        setPlaylistVisibility(value)

        props.onVisibilityChange(value)
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
                    placeholder="Playlist Title"
                    size="large"
                    bordered={false}
                    value={playlistName}
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
                    value={playlistDescription}
                    onChange={handleDescriptionOnChange}
                    maxLength={2500}
                    rows={4}
                />
            </div>

            <antd.Divider />

            <div className="field">
                <div className="field_header">
                    <Icons.Eye />
                    <span>Visibility</span>
                </div>

                <antd.Select
                    value={playlistVisibility}
                    onChange={handleVisibilityChange}
                    defaultValue={props.playlist.public ? "public" : "private"}
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
                        <img src={playlistThumbnail ?? "/assets/no_song.png"} alt="Thumbnail" />
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
                            disabled={!playlistThumbnail}
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
                <antd.Button
                    onClick={props.onDeletePlaylist}
                    icon={<Icons.MdDelete />}
                    danger
                >
                    Delete Playlist
                </antd.Button>
            </div>
        </div>
    </div>
}
