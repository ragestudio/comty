import React from "react"
import * as antd from "antd"

import CoverEditor from "@components/CoverEditor"
import { Icons } from "@components/Icons"

import LyricsEditor from "@components/MusicStudio/LyricsEditor"
import VideoEditor from "@components/MusicStudio/VideoEditor"

import "./index.less"

const TrackEditor = (props) => {
    const [track, setTrack] = React.useState(props.track ?? {})

    async function handleChange(key, value) {
        setTrack((prev) => {
            return {
                ...prev,
                [key]: value
            }
        })
    }

    async function openLyricsEditor() {
        app.layout.drawer.open("lyrics_editor", LyricsEditor, {
            type: "drawer",
            props: {
                width: "600px",
                headerStyle: {
                    display: "none",
                }
            },
            componentProps: {
                track,
                onSave: (lyrics) => {
                    console.log("Saving lyrics for track >", lyrics)
                },
            },
        })
    }

    async function openVideoEditor() {
        app.layout.drawer.open("video_editor", VideoEditor, {
            type: "drawer",
            props: {
                width: "600px",
                headerStyle: {
                    display: "none",
                }
            },
            componentProps: {
                track,
                onSave: (video) => {
                    console.log("Saving video for track", video)
                },
            },
        })
    }

    async function onClose() {
        if (typeof props.close === "function") {
            props.close()
        }
    }

    async function onSave() {
        await props.onSave(track)

        if (typeof props.close === "function") {
            props.close()
        }
    }

    return <div className="track-editor">
        <div className="track-editor-field">
            <div className="track-editor-field-header">
                <Icons.MdImage />
                <span>Cover</span>
            </div>

            <CoverEditor
                value={track.cover}
                onChange={(url) => handleChange("cover", url)}
                extraActions={[
                    <antd.Button>
                        Use Parent
                    </antd.Button>
                ]}
            />
        </div>

        <div className="track-editor-field">
            <div className="track-editor-field-header">
                <Icons.MdOutlineMusicNote />
                <span>Title</span>
            </div>

            <antd.Input
                value={track.title}
                placeholder="Track title"
                onChange={(e) => handleChange("title", e.target.value)}
            />
        </div>

        <div className="track-editor-field">
            <div className="track-editor-field-header">
                <Icons.User />
                <span>Artist</span>
            </div>

            <antd.Input
                value={track.artists.join(", ")}
                placeholder="Artist"
                onChange={(e) => handleChange("artist", e.target.value)}
            />
        </div>

        <div className="track-editor-field">
            <div className="track-editor-field-header">
                <Icons.MdAlbum />
                <span>Album</span>
            </div>

            <antd.Input
                value={track.album}
                placeholder="Album"
                onChange={(e) => handleChange("album", e.target.value)}
            />
        </div>

        <div className="track-editor-field">
            <div className="track-editor-field-header">
                <Icons.MdExplicit />
                <span>Explicit</span>
            </div>

            <antd.Switch
                checked={track.explicit}
                onChange={(value) => handleChange("explicit", value)}
            />
        </div>

        <antd.Divider
            style={{
                margin: "5px 0",
            }}
        />

        <div className="track-editor-field">
            <div className="track-editor-field-header">
                <Icons.TbMovie />
                <span>Edit Video</span>
            </div>

            <antd.Button
                onClick={openVideoEditor}
            >
                Edit
            </antd.Button>
        </div>

        <div className="track-editor-field">
            <div className="track-editor-field-header">
                <Icons.MdTextFormat />
                <span>Edit Lyrics</span>
            </div>

            <antd.Button
                onClick={openLyricsEditor}
            >
                Edit
            </antd.Button>
        </div>

        <div className="track-editor-field">
            <div className="track-editor-field-header">
                <Icons.MdTimeline />
                <span>Timestamps</span>
            </div>

            <antd.Button
                disabled
            >
                Edit
            </antd.Button>
        </div>

        <div className="track-editor-actions">
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

export default TrackEditor