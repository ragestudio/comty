import React from "react"
import PropTypes from "prop-types"
import classnames from "classnames"

import { parseLRC } from "../../utils/lrcParser"

import {
	Input,
	Button,
	List,
	Space,
	Typography,
	Select,
	Row,
	Col,
	Popconfirm,
	InputNumber,
	Empty,
	Flex,
	Switch,
} from "antd"

import {
	PlusOutlined,
	DeleteOutlined,
	EditOutlined,
	SaveOutlined,
	CloseOutlined,
	PlayCircleOutlined,
} from "@ant-design/icons"

import { MdSpaceBar } from "react-icons/md"

import "./index.less"

import { useLyricsEditor } from "../../context/LyricsEditorContext"
import { formatSecondsToLRC } from "../../utils/lrcParser"

import UploadButton from "@components/UploadButton"
import Languages from "@config/languages"

const { Text } = Typography
const { TextArea } = Input

const languageOptions = [
	...Object.entries(Languages).map(([key, value]) => ({
		label: value,
		value: key,
	})),
	{ label: "Original", value: "original" },
]

const Line = ({
	line,
	editData,
	setEditData,

	active,

	handleSeek,
	handleDeleteLine,
	handleEditLineSave,
	handleEditLineCancel,
	handleEditLineStart,
	handleClickDuplicate,
	handleEditLineSetAsBreak,
}) => {
	const editMode = editData && editData.time === line.time

	if (editMode) {
		return (
			<List.Item>
				<div style={{ width: "100%" }}>
					<Space
						direction="vertical"
						style={{ width: "100%" }}
						size="small"
					>
						<TextArea
							value={editData.text}
							onChange={(e) =>
								setEditData({
									...editData,
									text: e.target.value,
								})
							}
							autoSize={{
								minRows: 1,
								maxRows: 3,
							}}
							style={{ resize: "none" }}
						/>
						<Row gutter={8} align="middle">
							<Col span={6}>
								<InputNumber
									value={editData.time}
									onChange={(value) =>
										setEditData({
											...editData,
											time: value,
										})
									}
									step={0.1}
									style={{
										width: "100%",
									}}
									placeholder="Time (s)"
									size="small"
								/>
							</Col>
							<Col span={18}>
								<Space size="small">
									<Switch
										defaultChecked={editData.break}
										onChange={(checked) => {
											setEditData({
												...editData,
												break: checked,
											})
										}}
										size="small"
										label="Break"
									/>
									<Button
										type="primary"
										size="small"
										icon={<SaveOutlined />}
										onClick={handleEditLineSave}
									>
										Save
									</Button>
									<Button
										size="small"
										icon={<CloseOutlined />}
										onClick={handleEditLineCancel}
									>
										Cancel
									</Button>
								</Space>
							</Col>
						</Row>
					</Space>
				</div>
			</List.Item>
		)
	}

	return (
		<div
			className={classnames("avlyrics-editor-list-item", {
				active: active,
			})}
			id={`t${parseInt(line.time * 1000)}`}
		>
			<Row
				justify="space-between"
				align="middle"
				style={{ width: "100%" }}
			>
				<Col flex="80px">
					<Button
						type="link"
						size="small"
						icon={<PlayCircleOutlined />}
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()

							handleSeek(line.time)
						}}
						style={{
							padding: 0,
							height: "auto",
							fontSize: "12px",
						}}
					>
						{formatSecondsToLRC(line.time)}
					</Button>
				</Col>

				<Col
					flex="1"
					style={{
						marginLeft: 16,
						marginRight: 16,
					}}
				>
					<Text
						style={{
							wordBreak: "break-word",
						}}
					>
						{line.break && "<break>"}
						{!line.break && line.text}
					</Text>
				</Col>
				<Col flex="80px" style={{ textAlign: "right" }}>
					<Space size="small">
						<Button
							type="text"
							size="small"
							onClick={() => handleClickDuplicate(line)}
						>
							D
						</Button>
						<Button
							type="text"
							size="small"
							icon={<EditOutlined />}
							onClick={() => handleEditLineStart(line)}
							style={{ padding: "4px" }}
						/>
						<Popconfirm
							title="Delete this line?"
							onConfirm={() => handleDeleteLine(line)}
							okText="Delete"
							cancelText="Cancel"
							placement="topRight"
						>
							<Button
								type="text"
								size="small"
								icon={<DeleteOutlined />}
								danger
								style={{
									padding: "4px",
								}}
							/>
						</Popconfirm>
					</Space>
				</Col>
			</Row>
		</div>
	)
}

const LyricsEditor = ({ player }) => {
	const { state, dispatch } = useLyricsEditor()

	const newLineTextRef = React.useRef(null)
	const linesListRef = React.useRef(null)

	// ticker
	const tickerRef = React.useRef(null)
	const [followTime, setFollowTime] = React.useState(true)
	const [lineIndex, setLineIndex] = React.useState(null)

	const [selectedLanguage, setSelectedLanguage] = React.useState("original")
	const [newLineText, setNewLineText] = React.useState("")

	const [editData, setEditData] = React.useState(null)

	const lines = state.lyrics[state.selectedLanguage] ?? []

	const scrollToTime = React.useCallback((time) => {
		const lineSelector = `#t${parseInt(time * 1000)}`

		const lineElement = linesListRef.current.querySelector(lineSelector)

		if (lineElement) {
			lineElement.scrollIntoView({ behavior: "smooth" })
		}
	}, [])

	const handleAddLine = () => {
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
		scrollToTime(time)
	}

	const handleEditLineStart = (line) => {
		setEditData({
			text: line.text,
			time: line.time || 0,
		})
	}

	const handleEditLineSave = () => {
		dispatch({
			type: "UPDATE_LINE",
			payload: editData,
		})

		setEditData(null)
	}

	const handleEditLineCancel = () => {
		setEditData(null)
	}

	const handleDeleteLine = (line) => {
		dispatch({
			type: "REMOVE_LINE",
			payload: line,
		})
	}

	const handleAddLineBreak = () => {
		const time = player.current.audio.current.currentTime

		dispatch({
			type: "ADD_LINE",
			payload: {
				break: true,
				time: time,
			},
		})

		scrollToTime(time)
	}

	const handleClickDuplicate = (line) => {
		const nextTime = line.time + 0.4

		dispatch({
			type: "ADD_LINE",
			payload: {
				text: line.text,
				time: nextTime,
			},
		})
	}

	const handleSeek = (time) => {
		// TODO: call to player seek function
		player.current.seek(time)
	}

	const handleLanguageUpload = async (url) => {
		const data = await fetch(url)
		let text = await data.text()

		dispatch({
			type: "OVERRIDE_LINES",
			payload: parseLRC(text),
		})

		app.message.success("Language file loaded")
	}

	const followLineTick = () => {
		const currentTime = player.current.audio.current.currentTime

		const lineIndex = lines.findLastIndex((line) => {
			return currentTime >= line.time
		})

		if (lineIndex <= -1) {
			return false
		}

		setLineIndex(lineIndex)
	}

	React.useEffect(() => {
		if (state.isPlaying) {
			if (tickerRef.current) {
				clearInterval(tickerRef.current)
			}

			tickerRef.current = setInterval(followLineTick, 200)
		}

		return () => {
			clearInterval(tickerRef.current)
		}
	}, [followTime, state.isPlaying])

	React.useEffect(() => {
		if (followTime === true && lineIndex !== -1) {
			const line = lines[lineIndex]

			if (line) {
				scrollToTime(line.time)
			}
		}
	}, [lineIndex])

	return (
		<Space direction="vertical" size="large" style={{ width: "100%" }}>
			<Row gutter={16} align="middle">
				<Col span={6}>
					<Select
						value={selectedLanguage}
						onChange={setSelectedLanguage}
						options={languageOptions}
						style={{ width: "100%" }}
						placeholder="Select language"
					/>
				</Col>
				<Col span={18}>
					<UploadButton
						onSuccess={(_, data) => handleLanguageUpload(data.url)}
						accept={["text/*"]}
						size="small"
					>
						Load file
					</UploadButton>
				</Col>
			</Row>

			<Flex horizontal align="center" gap={8}>
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

			{state.lyrics.length === 0 && (
				<Empty
					description="No lyrics available"
					image={Empty.PRESENTED_IMAGE_SIMPLE}
				>
					<Text type="secondary">
						Add lyrics manually or upload an LRC file
					</Text>
				</Empty>
			)}

			<Row justify="space-between" align="middle">
				<Text type="secondary" style={{ fontSize: "12px" }}>
					{lines.length} lines
				</Text>
			</Row>

			<div className="avlyrics-editor-list" ref={linesListRef}>
				{lines.map((line, index) => {
					return (
						<Line
							key={index}
							line={line}
							active={index === lineIndex && followTime}
							setEditData={setEditData}
							editData={editData}
							handleSeek={handleSeek}
							handleDeleteLine={handleDeleteLine}
							handleEditLineStart={handleEditLineStart}
							handleEditLineSave={handleEditLineSave}
							handleEditLineCancel={handleEditLineCancel}
							handleClickDuplicate={handleClickDuplicate}
						/>
					)
				})}
			</div>
		</Space>
	)
}

LyricsEditor.propTypes = {
	lyrics: PropTypes.arrayOf(PropTypes.string).isRequired,
}

export default LyricsEditor
