import React from "react"
import { Typography, Input } from "antd"

import classnames from "classnames"

import {
	Button,
	List,
	Space,
	Row,
	Col,
	Popconfirm,
	InputNumber,
	Switch,
} from "antd"

import {
	DeleteOutlined,
	EditOutlined,
	SaveOutlined,
	CloseOutlined,
	PlayCircleOutlined,
} from "@ant-design/icons"

import { formatSecondsToLRC } from "../../utils/lrcParser"

const { Text } = Typography
const { TextArea } = Input

const Line = React.memo(
	({
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
							<Row
								gutter={8}
								align="middle"
							>
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
					<Col
						flex="80px"
						style={{ textAlign: "right" }}
					>
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
	},
)

Line.displayName = "Line"

export default Line
