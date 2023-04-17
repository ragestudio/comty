import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import UploadButton from "components/UploadButton"

import { Icons } from "components/Icons"

import "./index.less"

const UploadHint = (props) => {
    return <div className="uploadHint">
        <Icons.MdPlaylistAdd />
        <p>Upload your tracks</p>
        <p>Drag and drop your tracks here or click this box to start uploading files.</p>
    </div>
}

const FileItemEditor = (props) => {
    const [track, setTrack] = React.useState(props.track ?? {})

    const handleChange = (key, value) => {
        setTrack((oldData) => {
            return {
                ...oldData,
                [key]: value
            }
        })
    }

    const onClose = () => {
        if (typeof props.close === "function") {
            props.close()
        }
    }

    const onSave = async () => {
        await props.onSave(track)

        if (typeof props.close === "function") {
            props.close()
        }
    }

    return <div className="fileItemEditor">
        <div className="fileItemEditor_field">
            <div className="fileItemEditor_field_header">
                <Icons.MdImage />
                <span>Thumbnail</span>
            </div>

            <div className="fileItemEditor_field_thumnail">
                <img src={track.thumbnail} />
            </div>

            <div className="fileItemEditor_actions">
                <UploadButton
                    accept="image/*"
                    onUploadDone={(file) => handleChange("thumbnail", file.url)}
                />
                {
                    track.thumbnail && <antd.Button
                        icon={<Icons.MdClose />}
                        type="text"
                        onClick={() => handleChange("thumbnail", null)}
                    >
                        Remove
                    </antd.Button>
                }
            </div>
        </div>

        <div className="fileItemEditor_field">
            <div className="fileItemEditor_field_header">
                <Icons.MdOutlineMusicNote />
                <span>Title</span>
            </div>

            <antd.Input
                value={track.title}
                placeholder="Track title"
                onChange={(e) => handleChange("title", e.target.value)}
            />
        </div>

        <div className="fileItemEditor_field">
            <div className="fileItemEditor_field_header">
                <Icons.User />
                <span>Artist</span>
            </div>

            <antd.Input
                value={track.artist}
                placeholder="Artist"
                onChange={(e) => handleChange("artist", e.target.value)}
            />
        </div>

        <div className="fileItemEditor_field">
            <div className="fileItemEditor_field_header">
                <Icons.MdAlbum />
                <span>Album</span>
            </div>

            <antd.Input
                value={track.album}
                placeholder="Album"
                onChange={(e) => handleChange("album", e.target.value)}
            />
        </div>

        <div className="fileItemEditor_field">
            <div className="fileItemEditor_field_header">
                <Icons.MdExplicit />
                <span>Explicit</span>
            </div>

            <antd.Switch
                checked={track.explicit}
                onChange={(value) => handleChange("explicit", value)}
            />
        </div>

        <div className="fileItemEditor_actions">
            <antd.Button
                type="text"
                icon={<Icons.MdClose />}
                onClick={onClose}
            >
                Cancel
            </antd.Button>

            <antd.Button
                type="primary"
                icon={<Icons.MdCheck />}
                onClick={onSave}
            >
                Save
            </antd.Button>
        </div>
    </div>
}

const FileListItem = (props) => {
    const isUploading = props.track.status === "uploading"

    return <Draggable key={props.track.uid} draggableId={props.track.uid} index={props.index}>
        {(provided, snapshot) => {
            return <div
                className={classnames(
                    "fileListItem",
                    {
                        ["uploading"]: isUploading,
                    }
                )}
                ref={provided.innerRef}
                {...provided.draggableProps}
            >

                {
                    isUploading &&
                    <Icons.LoadingOutlined
                        spin
                        className="fileListItem_loadingIcon"
                    />
                }

                <div className="fileListItem_cover">
                    <img
                        src={props.track?.thumbnail}
                        alt="Track cover"
                    />
                </div>

                <div className="fileListItem_details">
                    <div className="fileListItem_namings">
                        <h4>
                            <span
                                style={{
                                    marginRight: "0.6rem",
                                    fontSize: "0.7rem"
                                }}
                            >
                                {props.index + 1} -
                            </span>

                            {
                                props.track?.title ?? "Unknown title"
                            }
                        </h4>

                        <p
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                            }}
                        >
                            <span>
                                {
                                    props.track?.artist ?? "Unknown artist"
                                }
                            </span>

                            <span>-</span>

                            <span>
                                {
                                    props.track?.album ?? "Unknown album"
                                }
                            </span>
                        </p>
                    </div>

                    <div className="fileListItem_actions">
                        <antd.Button
                            type="primary"
                            icon={<Icons.MdEdit />}
                            onClick={props.onClickEdit}
                            disabled={isUploading}
                        />

                        <antd.Popconfirm
                            title="Delete this track?"
                            description="Are you sure to delete this track?"
                            onConfirm={props.onClickRemove}
                            okText="Yes"
                            cancelText="No"
                        >
                            <antd.Button
                                icon={<Icons.MdDelete />}
                            />
                        </antd.Popconfirm>
                    </div>
                </div>

                <div
                    {...provided.dragHandleProps}
                    className="fileListItem_dragHandle"
                >
                    <Icons.MdDragIndicator />
                </div>
            </div>
        }}
    </Draggable>
}

export default (props) => {
    const onClickEditTrack = (track) => {
        console.log("Editing track", track)

        app.DrawerController.open("track_editor", FileItemEditor, {
            type: "drawer",
            componentProps: {
                track,
                onSave: (newTrackData) => {
                    props.handleTrackInfoChange(newTrackData.uid, newTrackData)
                }
            },
        })
    }

    return <div className="tracksUploads">
        <p>
            Uploading files that are not permitted by our <a onClick={() => app.setLocation("/terms")}>Terms of Service</a> may result in your account being suspended.
        </p>

        <div className="uploadBox">
            <antd.Upload
                className="uploader"
                customRequest={props.handleUploadTrack}
                onChange={props.onTrackUploaderChange}
                accept="audio/*"
                multiple
                showUploadList={false}
            >
                {
                    props.fileList.length === 0 ?
                        <UploadHint /> : <antd.Button
                            className="uploadMoreButton"
                            icon={<Icons.Plus />}
                        />
                }
            </antd.Upload>

            <div className="fileList_wrapper">
                <DragDropContext onDragEnd={props.handleTrackDragEnd}>
                    <Droppable droppableId="droppable">
                        {(provided, snapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="fileList"
                            >
                                {
                                    props.trackList.map((track, index) => {
                                        return <FileListItem
                                            index={index}
                                            track={track}
                                            onClickChangeCover={() => {
                                                return props.handleTrackCoverChange(track.uid)
                                            }}
                                            onTitleChange={(event) => {
                                                return props.handleTrackInfoChange(track.uid, "title", event.target.value)
                                            }}
                                            onClickRemove={() => {
                                                return props.handleTrackRemove(track.uid)
                                            }}
                                            onClickEdit={() => {
                                                return onClickEditTrack(track)
                                            }}
                                        />
                                    })
                                }
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </div>
    </div>
}