import React from "react"
import * as antd from "antd"

import Streaming from "@models/spectrum"

import "./index.less"

const ProfileCreator = (props) => {
	const [loading, setLoading] = React.useState(false)
	const [title, setTitle] = React.useState(props.editValue ?? null)

	function handleChange(e) {
		setTitle(e.target.value.trim())
	}

	async function handleSubmit() {
		setLoading(true)

		const result = await Streaming.createProfile({
			info: {
				title: title,
			},
		}).catch((error) => {
			console.error(error)
			app.message.error("Failed to create")
			return null
		})

		if (result) {
			app.message.success("Created")
			app.eventBus.emit("app:new_profile", result)

			props.onCreate(result._id, result)
		}

		props.close()

		setLoading(false)
	}

	return (
		<div className="profile-creator">
			<antd.Input
				value={title}
				placeholder="Enter a profile title"
				onChange={handleChange}
			/>

			<div className="profile-creator-actions">
				<antd.Button onClick={props.close}>Cancel</antd.Button>

				<antd.Button
					type="primary"
					onClick={() => {
						handleSubmit(title)
					}}
					disabled={!title || loading}
					loading={loading}
				>
					Create
				</antd.Button>
			</div>
		</div>
	)
}

export default ProfileCreator
