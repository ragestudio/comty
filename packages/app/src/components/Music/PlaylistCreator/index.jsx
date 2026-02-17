import React from "react"
import * as antd from "antd"
import { Icons } from "@components/Icons"

import MusicModel from "@models/music"

import "./index.less"

export const PlaylistCreator = (props) => {
	const [submitting, setSubmitting] = React.useState(false)

	const handleSubmit = async (values) => {
		setSubmitting(true)

		const result = await MusicModel.newPlaylist(values).catch((err) => {
			console.error(err)
			app.message.error("Failed to create playlist")

			return null
		})

		setSubmitting(false)

		if (result) {
			app.navigation.goToPlaylist(result._id)

			if (typeof props.close === "function") {
				props.close()
			}
		}
	}

	return (
		<div className="playlist_creator">
			<antd.Form
				name="playlist"
				className="playlist_creator_form"
				onFinish={handleSubmit}
				layout="vertical"
				initialValues={{
					public: false,
				}}
			>
				<antd.Form.Item
					name="title"
					label="Title"
				>
					<antd.Input placeholder="Playlist name" />
				</antd.Form.Item>

				<antd.Form.Item
					name="description"
					label="Description"
				>
					<antd.Input.TextArea />
				</antd.Form.Item>

				<antd.Form.Item
					name="public"
					label={
						<span>
							<Icons.Earth />
							Public
						</span>
					}
				>
					<antd.Switch />
				</antd.Form.Item>

				<div className="playlist_creator_actions">
					<antd.Button
						type="primary"
						size="large"
						htmlType="submit"
						disabled={submitting}
						loading={submitting}
					>
						Create
					</antd.Button>
				</div>
			</antd.Form>
		</div>
	)
}

export const openModal = () => {
	app.layout.modal.open("playlist_creator", PlaylistCreator)
}

export default openModal
