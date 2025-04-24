import React from "react"
import * as antd from "antd"

import CoverEditor from "@components/CoverEditor"
import { Icons } from "@components/Icons"
import EnhancedLyricsEditor from "@components/MusicStudio/EnhancedLyricsEditor"

import { ReleaseEditorStateContext } from "@contexts/MusicReleaseEditor"

import "./index.less"

const TrackEditor = (props) => {
	const context = React.useContext(ReleaseEditorStateContext)
	const [track, setTrack] = React.useState(props.track ?? {})

	async function handleChange(key, value) {
		setTrack((prev) => {
			return {
				...prev,
				[key]: value,
			}
		})
	}

	async function openEnhancedLyricsEditor() {
		context.renderCustomPage({
			header: "Enhanced Lyrics",
			content: EnhancedLyricsEditor,
			props: {
				track: track,
			},
		})
	}

	async function handleOnSave() {
		setTrack((prev) => {
			const listData = [...context.items]

			const trackIndex = listData.findIndex(
				(item) => item.uid === prev.uid,
			)

			if (trackIndex === -1) {
				return prev
			}

			listData[trackIndex] = prev

			context.setGlobalState({
				...context,
				items: listData,
			})

			props.close()

			return prev
		})
	}

	function setParentCover() {
		handleChange("cover", context.cover)
	}

	React.useEffect(() => {
		context.setCustomPageActions([
			{
				label: "Save",
				icon: "FiSave",
				type: "primary",
				onClick: handleOnSave,
				disabled: props.track === track,
			},
		])
	}, [track])

	return (
		<div className="track-editor">
			<div className="track-editor-field">
				<div className="track-editor-field-header">
					<Icons.MdImage />
					<span>Cover</span>
				</div>

				<CoverEditor
					value={track.cover}
					onChange={(url) => handleChange("cover", url)}
					extraActions={[
						<antd.Button onClick={setParentCover}>
							Use Parent
						</antd.Button>,
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
					<Icons.FiUser />
					<span>Artist</span>
				</div>

				<antd.Input
					value={track.artist}
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

			<div className="track-editor-field">
				<div className="track-editor-field-header">
					<Icons.MdLyrics />
					<span>Enhanced Lyrics</span>
				</div>

				<div className="track-editor-field-actions">
					<antd.Button
						disabled={!track.params._id}
						onClick={openEnhancedLyricsEditor}
					>
						Edit
					</antd.Button>

					{!track.params._id && (
						<span>
							You cannot edit Video and Lyrics without release
							first
						</span>
					)}
				</div>
			</div>
		</div>
	)
}

export default TrackEditor
