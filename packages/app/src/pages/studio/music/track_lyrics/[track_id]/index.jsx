import React, { useEffect } from "react"
import PropTypes from "prop-types"
import { Button, Segmented, Alert, Flex } from "antd"
import { SaveOutlined } from "@ant-design/icons"
import { parseLRC, formatToLRC } from "./utils/lrcParser"

import {
	LyricsEditorProvider,
	useLyricsEditor,
} from "./context/LyricsEditorContext"

import Skeleton from "@components/Skeleton"

import VideoEditor from "./tabs/videos"
import LyricsEditor from "./tabs/lyrics"
import InlinePlayer from "./components/InlinePlayer"
import MusicModel from "@models/music"

import "./index.less"

const EnhancedLyricsEditorContent = ({ trackId }) => {
	const { state, dispatch } = useLyricsEditor()

	const [activeTab, setActiveTab] = React.useState("lyrics")
	const playerRef = React.useRef(null)

	const loadTrackData = async () => {
		dispatch({ type: "SET_LOADING", payload: true })

		try {
			const track = await MusicModel.getTrackData(trackId)

			if (!track) {
				throw new Error("Track not found")
			}

			dispatch({ type: "SET_TRACK", payload: track })

			let lyrics = await MusicModel.getTrackLyrics(trackId, {
				fetchAll: true,
			}).catch(() => {
				return {
					lrc: {
						original: [],
					},
				}
			})

			for await (const [lang, lrc] of Object.entries(lyrics.lrc)) {
				if (typeof lrc === "string" && lrc.startsWith("https://")) {
					lyrics.lrc[lang] = await fetch(lrc).then((res) =>
						res.text(),
					)

					lyrics.lrc[lang] = parseLRC(lyrics.lrc[lang])
				}
			}

			dispatch({ type: "SET_LYRICS", payload: lyrics.lrc })

			if (lyrics.video_source) {
				dispatch({
					type: "SET_VIDEO_SOURCE",
					payload: lyrics.video_source,
				})
				dispatch({
					type: "SET_VIDEO_SYNC",
					payload: lyrics.video_starts_at ?? lyrics.sync_audio_at,
				})
			}
		} catch (error) {
			console.error("Failed to load track:", error)
		} finally {
			dispatch({ type: "SET_LOADING", payload: false })
		}
	}

	const handleSave = async () => {
		dispatch({ type: "SET_SAVING", payload: true })

		try {
			const saveData = {
				video_source: state.videoSource || null,
				video_starts_at: state.videoSyncTime || null,
				lrc: state.lyrics,
			}

			await MusicModel.putTrackLyrics(trackId, saveData)

			app.message.success("Changes saved successfully")
		} catch (error) {
			console.error("Save failed:", error)
			app.message.error("Failed to save changes")
		} finally {
			dispatch({ type: "SET_SAVING", payload: false })
		}
	}

	const keyboardEvents = {
		Space: () => {
			const { toggle } = playerRef.current

			toggle()
		},
		ArrowLeft: (event) => {
			const { seek, audio } = playerRef.current

			if (event.ctrlKey) {
				if (event.ctrlKey && event.shiftKey) {
					seek(audio.current.currentTime - 0.001, true)
				} else {
					seek(audio.current.currentTime - 0.1, true)
				}
			} else {
				seek(audio.current.currentTime - 1, true)
			}
		},
		ArrowRight: (event) => {
			const { seek, audio } = playerRef.current

			if (event.ctrlKey) {
				if (event.ctrlKey && event.shiftKey) {
					seek(audio.current.currentTime + 0.001, true)
				} else {
					seek(audio.current.currentTime + 0.1, true)
				}
			} else {
				seek(audio.current.currentTime + 1, true)
			}
		},
	}

	const handleKeyDown = React.useCallback((event) => {
		// check the target is not a input element
		if (
			event.target.nodeName === "INPUT" ||
			event.target.nodeName === "TEXTAREA" ||
			event.target.nodeName === "SELECT" ||
			event.target.nodeName === "OPTION" ||
			event.target.nodeName === "BUTTON"
		) {
			return false
		}

		if (keyboardEvents[event.code]) {
			keyboardEvents[event.code](event)
		}
	}, [])

	React.useEffect(() => {
		document.addEventListener("keydown", handleKeyDown)

		return () => {
			document.removeEventListener("keydown", handleKeyDown)
		}
	}, [])

	// Loader effect
	useEffect(() => {
		if (trackId) {
			loadTrackData()
		}
	}, [])

	if (state.loading || !state.track) {
		return <Skeleton />
	}

	return (
		<div className="avlyrics-editor">
			<Flex horizontal align="center" justify="space-between">
				<h1>{state.track.title}</h1>

				<Button
					type="primary"
					icon={<SaveOutlined />}
					onClick={handleSave}
					loading={state.saving}
					//disabled={!state.isDirty}
				>
					Save Changes
				</Button>
			</Flex>

			<Segmented
				value={activeTab}
				onChange={setActiveTab}
				options={[
					{ label: "Lyrics", value: "lyrics" },
					{ label: "Video", value: "video" },
				]}
				style={{ marginBottom: "20px" }}
			/>

			<InlinePlayer ref={playerRef} src={state.track.source} />

			{activeTab === "lyrics" && <LyricsEditor player={playerRef} />}
			{activeTab === "video" && <VideoEditor />}
		</div>
	)
}

EnhancedLyricsEditorContent.propTypes = {
	trackId: PropTypes.string.isRequired,
}

const EnhancedLyricsEditor = ({ params }) => {
	const trackId = params?.track_id

	if (!trackId) {
		return (
			<Alert
				message="Invalid Track"
				description="No track ID provided in the URL parameters"
				type="error"
			/>
		)
	}

	return (
		<LyricsEditorProvider>
			<EnhancedLyricsEditorContent trackId={trackId} />
		</LyricsEditorProvider>
	)
}

EnhancedLyricsEditor.options = {
	layout: {
		type: "default",
		centeredContent: true,
	},
}

EnhancedLyricsEditor.propTypes = {
	params: PropTypes.shape({
		track_id: PropTypes.string.isRequired,
	}).isRequired,
}

export default EnhancedLyricsEditor
