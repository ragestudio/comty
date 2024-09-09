import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { Draggable } from "react-beautiful-dnd"

import Image from "@components/Image"
import { Icons } from "@components/Icons"
import TrackEditor from "@components/MusicStudio/TrackEditor"

import { ReleaseEditorStateContext } from "@contexts/MusicReleaseEditor"

import "./index.less"

const TrackListItem = (props) => {
    const context = React.useContext(ReleaseEditorStateContext)

    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState(null)

    const { track } = props

    async function onClickEditTrack() {
        context.setCustomPage({
            header: "Track Editor",
            content: <TrackEditor track={track} />,
            props: {
                onSave: (newTrackData) => {
                    console.log("Saving track", newTrackData)
                },
            }
        })
    }

    return <Draggable
        key={track._id}
        draggableId={track._id}
        index={props.index}
    >
        {
            (provided, snapshot) => {
                return <div
                    className={classnames(
                        "music-studio-release-editor-tracks-list-item",
                        {
                            ["loading"]: loading,
                            ["failed"]: !!error
                        }
                    )}
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                >
                    <div className="music-studio-release-editor-tracks-list-item-index">
                        <span>{props.index + 1}</span>
                    </div>

                    <Image
                        src={track.cover}
                        height={25}
                        width={25}
                        style={{
                            borderRadius: 8,
                        }}
                    />

                    <span>{track.title}</span>

                    <div className="music-studio-release-editor-tracks-list-item-actions">
                        <antd.Button
                            type="ghost"
                            icon={<Icons.Edit2 />}
                            onClick={onClickEditTrack}
                        />

                        <div
                            {...provided.dragHandleProps}
                            className="music-studio-release-editor-tracks-list-item-dragger"
                        >
                            <Icons.MdDragIndicator />
                        </div>
                    </div>
                </div>
            }
        }
    </Draggable>
}

export default TrackListItem