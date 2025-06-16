import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"

import CoverEditor from "@components/CoverEditor"

const ReleasesTypes = [
	{
		value: "single",
		label: "Single",
		icon: <Icons.MdMusicNote />,
	},
	{
		value: "ep",
		label: "Episode",
		icon: <Icons.MdAlbum />,
	},
	{
		value: "album",
		label: "Album",
		icon: <Icons.MdAlbum />,
	},
	{
		value: "compilation",
		label: "Compilation",
		icon: <Icons.MdAlbum />,
	},
]

const BasicInformation = ({ data, changeData }) => {
	const handleFormChange = React.useCallback(
		(changes) => {
			changeData((prev) => ({ ...prev, ...changes }))
		},
		[data],
	)

	return (
		<div className="music-studio-release-editor-tab">
			<h1>Release Information</h1>

			<antd.Form
				name="basic"
				layout="vertical"
				requiredMark={false}
				onValuesChange={handleFormChange}
			>
				<antd.Form.Item
					label=""
					name="cover"
					rules={[
						{
							required: true,
							message: "Input a cover for the release",
						},
					]}
					initialValue={data?.cover}
				>
					<CoverEditor defaultUrl="https://storage.ragestudio.net/comty-static-assets/default_song.png" />
				</antd.Form.Item>

				{data?._id && (
					<antd.Form.Item
						label={
							<>
								<Icons.MdTag /> <span>ID</span>
							</>
						}
						name="_id"
						initialValue={data._id}
					>
						<antd.Input placeholder="Release ID" disabled />
					</antd.Form.Item>
				)}

				<antd.Form.Item
					label={
						<>
							<Icons.MdMusicNote /> <span>Title</span>
						</>
					}
					name="title"
					rules={[
						{
							required: true,
							message: "Input a title for the release",
						},
					]}
					initialValue={data?.title}
				>
					<antd.Input
						placeholder="Release title"
						maxLength={128}
						showCount
					/>
				</antd.Form.Item>

				<antd.Form.Item
					label={
						<>
							<Icons.MdAlbum /> <span>Type</span>
						</>
					}
					name="type"
					rules={[
						{
							required: true,
							message: "Select a type for the release",
						},
					]}
					initialValue={data?.type}
				>
					<antd.Select
						placeholder="Release type"
						options={ReleasesTypes}
					/>
				</antd.Form.Item>

				<antd.Form.Item
					label={
						<>
							<Icons.MdPublic /> <span>Public</span>
						</>
					}
					name="public"
					initialValue={data?.public}
				>
					<antd.Switch />
				</antd.Form.Item>
			</antd.Form>
		</div>
	)
}

export default BasicInformation
