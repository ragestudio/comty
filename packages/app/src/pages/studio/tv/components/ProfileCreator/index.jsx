import React from "react"
import * as antd from "antd"

import Streaming from "@models/spectrum"

import "./index.less"

const ProfileCreator = (props) => {
	const [loading, setLoading] = React.useState(false)
	const [name, setName] = React.useState(props.editValue ?? null)

	function handleChange(e) {
		setName(e.target.value.trim())
	}

	async function handleSubmit() {
		setLoading(true)

		if (props.editValue) {
			if (typeof props.onEdit === "function") {
				await props.onEdit(name)
			}
		} else {
			const result = await Streaming.createOrUpdateProfile({
				profile_name: name,
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
		}

		props.close()

		setLoading(false)
	}

	return (
		<div className="profile-creator">
			<antd.Input
				value={name}
				placeholder="Enter a profile name"
				onChange={handleChange}
			/>

			<div className="profile-creator-actions">
				<antd.Button onClick={props.close}>Cancel</antd.Button>

				<antd.Button
					type="primary"
					onClick={() => {
						handleSubmit(name)
					}}
					disabled={!name || loading}
					loading={loading}
				>
					{props.editValue ? "Update" : "Create"}
				</antd.Button>
			</div>
		</div>
	)
}

export default ProfileCreator
