import React from "react"
import PropTypes from "prop-types"
import VirtualizedLyricsList from "@pages/studio/music/track_lyrics/[track_id]/components/LyricsEntriesList"

import { parseLRC, formatToLRC } from "../../utils/lrcParser"

import {
	Input,
	Button,
	Space,
	Typography,
	Select,
	Row,
	Col,
	Empty,
	Flex,
} from "antd"

import { PlusOutlined } from "@ant-design/icons"
import { MdSpaceBar } from "react-icons/md"

import { useLyricsEditor } from "../../context/LyricsEditorContext"

import Languages from "@config/languages"

import "./index.less"

const { Text } = Typography
const { TextArea } = Input

const languageOptions = [
	...Object.entries(Languages).map(([key, value]) => ({
		label: value,
		value: key,
	})),
	{ label: "Original", value: "original" },
]

const LyricsEditor = ({ player }) => {
	const { state, dispatch } = useLyricsEditor()

	const newLineTextRef = React.useRef(null)

	// ticker
	const [lineIndex, setLineIndex] = React.useState(null)
	const lastUpdateRef = React.useRef(0)

	const [newLineText, setNewLineText] = React.useState("")
	const [editData, setEditData] = React.useState(null)

	const lines = state.lyrics[state.selectedLanguage]

	// binary search for active line (optimized)
	const findActiveLineIndex = React.useCallback(
		(currentTime) => {
			const linesLength = lines.length

			if (linesLength === 0) return -1
			if (currentTime < lines[0].time) return -1
			if (currentTime >= lines[linesLength - 1].time)
				return linesLength - 1

			let left = 0
			let right = linesLength - 1
			let result = -1

			while (left <= right) {
				const mid = (left + right) >> 1 // faster than Math.floor

				if (lines[mid].time <= currentTime) {
					result = mid
					left = mid + 1
				} else {
					right = mid - 1
				}
			}

			return result
		},
		[lines],
	)

	const handleAddLine = React.useCallback(() => {
		if (!newLineText.trim()) {
			return null
		}

		const time = player.current.audio.current.currentTime

		dispatch({
			type: "ADD_LINE",
			payload: {
				text: newLineText.trim(),
				time: time,
			},
		})

		setNewLineText("")
	}, [newLineText, player, dispatch])

	const handleEditLineStart = React.useCallback((line) => {
		setEditData({
			text: line.text,
			time: line.time || 0,
		})
	}, [])

	const handleEditLineSave = React.useCallback(() => {
		dispatch({
			type: "UPDATE_LINE",
			payload: editData,
		})

		setEditData(null)
	}, [editData, dispatch])

	const handleEditLineCancel = React.useCallback(() => {
		setEditData(null)
	}, [])

	const handleDeleteLine = React.useCallback(
		(line) => {
			dispatch({
				type: "REMOVE_LINE",
				payload: line,
			})
		},
		[dispatch],
	)

	const handleAddLineBreak = React.useCallback(() => {
		const time = player.current.audio.current.currentTime

		dispatch({
			type: "ADD_LINE",
			payload: {
				break: true,
				time: time,
			},
		})
	}, [player, dispatch])

	const handleClickDuplicate = React.useCallback(
		(line) => {
			const nextTime = line.time + 0.4

			dispatch({
				type: "ADD_LINE",
				payload: {
					text: line.text,
					time: nextTime,
				},
			})
		},
		[dispatch],
	)

	const handleSeek = React.useCallback(
		(time) => {
			player.current.seek(time)
		},
		[player],
	)

	const handleLanguageUpload = React.useCallback(async () => {
		const input = document.createElement("input")

		input.type = "file"
		input.accept = "text/*"

		input.onchange = async (e) => {
			const file = e.target.files[0]
			const text = await file.text()

			dispatch({
				type: "OVERRIDE_LINES",
				payload: parseLRC(text),
			})

			app.message.success("Language file loaded")
		}

		input.click()
	}, [dispatch])

	const handleLanguageDownload = React.useCallback(() => {
		const data = formatToLRC(lines)
		const blob = new Blob([data], { type: "text/plain" })
		const url = URL.createObjectURL(blob)

		const link = document.createElement("a")
		link.href = url
		link.download = `${state.track.title} - ${state.selectedLanguage}.txt`
		link.click()
	}, [lines, state.track?.title, state.selectedLanguage])

	const followLineTick = React.useCallback(() => {
		const now = Date.now()
		// throttle updates to 100ms
		if (now - lastUpdateRef.current < 100) {
			return
		}

		const currentTime = player.current.audio.current.currentTime
		const index = findActiveLineIndex(currentTime)

		if (index !== -1 && index !== lineIndex) {
			setLineIndex(index)
			lastUpdateRef.current = now
		}
	}, [player, findActiveLineIndex, lineIndex])

	const handleSelectLanguageChange = React.useCallback(
		(language) => {
			dispatch({
				type: "SET_SELECTED_LANGUAGE",
				payload: language,
			})
		},
		[dispatch],
	)

	// use requestAnimationFrame for smoother updates
	React.useEffect(() => {
		if (!state.isPlaying) {
			return
		}

		let animationFrameId
		let lastTime = 0

		const updateLine = (timestamp) => {
			if (timestamp - lastTime > 16) {
				followLineTick()
				lastTime = timestamp
			}

			animationFrameId = requestAnimationFrame(updateLine)
		}

		animationFrameId = requestAnimationFrame(updateLine)

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId)
			}
		}
	}, [state.isPlaying, followLineTick])

	return (
		<Space
			direction="vertical"
			size="large"
			style={{ width: "100%" }}
		>
			<Row
				gutter={16}
				align="middle"
			>
				<Col span={6}>
					<Select
						value={state.selectedLanguage}
						onChange={handleSelectLanguageChange}
						options={languageOptions}
						style={{ width: "100%" }}
						placeholder="Select language"
					/>
				</Col>
				<Col span={18}>
					<Button
						onClick={handleLanguageUpload}
						accept={["text/*"]}
						size="small"
					>
						Load from file
					</Button>
					<Button
						onClick={handleLanguageDownload}
						size="small"
					>
						Download current
					</Button>
				</Col>
			</Row>

			<Flex
				horizontal
				align="center"
				gap={8}
			>
				<TextArea
					ref={newLineTextRef}
					value={newLineText}
					onChange={(e) => setNewLineText(e.target.value)}
					placeholder="Enter text and press Enter to add to current time"
					autoSize={{ minRows: 1, maxRows: 3 }}
					onPressEnter={(e) => {
						if (!e.shiftKey) {
							e.preventDefault()
							newLineTextRef.current.blur()
							handleAddLine()
						}
					}}
					style={{ resize: "none" }}
				/>
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={handleAddLine}
					disabled={!newLineText.trim()}
					style={{ width: "fit-content", minWidth: "30px" }}
				/>
				<Button
					icon={<MdSpaceBar />}
					onClick={handleAddLineBreak}
					style={{ width: "fit-content", minWidth: "30px" }}
				/>
			</Flex>

			<Row
				justify="space-between"
				align="middle"
			>
				<Text
					type="secondary"
					style={{ fontSize: "12px" }}
				>
					{lines.length} lines
				</Text>
			</Row>

			<VirtualizedLyricsList
				lines={lines}
				lineIndex={lineIndex}
				editData={editData}
				setEditData={setEditData}
				handleSeek={handleSeek}
				handleDeleteLine={handleDeleteLine}
				handleEditLineStart={handleEditLineStart}
				handleEditLineSave={handleEditLineSave}
				handleEditLineCancel={handleEditLineCancel}
				handleClickDuplicate={handleClickDuplicate}
			/>
		</Space>
	)
}

LyricsEditor.propTypes = {
	player: PropTypes.object.isRequired,
}

export default LyricsEditor
