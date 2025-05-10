import React from "react"
import * as antd from "antd"
import { FiPlusCircle } from "react-icons/fi"
import Streaming from "@models/spectrum"

const NewRestreamServerForm = ({ profile, loading, handleProfileUpdate }) => {
	const [newRestreamHost, setNewRestreamHost] = React.useState("")
	const [newRestreamKey, setNewRestreamKey] = React.useState("")

	async function handleAddRestream() {
		if (!newRestreamHost || !newRestreamKey) {
			antd.message.error("Host URL and Key are required.")
			return
		}

		if (
			!newRestreamHost.startsWith("rtmp://") &&
			!newRestreamHost.startsWith("rtsp://")
		) {
			antd.message.error(
				"Invalid host URL. Must start with rtmp:// or rtsp://",
			)
			return
		}

		try {
			const updatedProfile = await Streaming.addRestreamToProfile(
				profile._id,
				{ host: newRestreamHost, key: newRestreamKey },
			)
			if (updatedProfile && updatedProfile.restreams) {
				handleProfileUpdate("restreams", updatedProfile.restreams)
				setNewRestreamHost("")
				setNewRestreamKey("")
				antd.message.success("Restream server added successfully.")
			} else {
				antd.message.error(
					"Failed to add restream server: No profile data returned from API.",
				)
			}
		} catch (err) {
			console.error("Failed to add restream server:", err)
			const errorMessage =
				err.response?.data?.message ||
				err.message ||
				"An unknown error occurred while adding the restream server."
			antd.message.error(errorMessage)
		}
	}

	return (
		<div className="profile-section content-panel">
			<div className="data-field__label">
				<span>New server</span>
				<p>Add a new restream server to the list.</p>
			</div>

			<div className="data-field__value">
				<span>Host</span>
				<antd.Input
					name="stream_host"
					placeholder="rtmp://example.server"
					value={newRestreamHost}
					onChange={(e) => setNewRestreamHost(e.target.value)}
					disabled={loading}
				/>
			</div>

			<div className="data-field__value">
				<span>Key</span>
				<antd.Input
					name="stream_key"
					placeholder="xxxx-xxxx-xxxx"
					value={newRestreamKey}
					onChange={(e) => setNewRestreamKey(e.target.value)}
					disabled={loading}
				/>
			</div>

			<antd.Button
				type="primary"
				onClick={handleAddRestream}
				loading={loading}
				disabled={loading || !newRestreamHost || !newRestreamKey}
				icon={<FiPlusCircle />}
			>
				Add Restream Server
			</antd.Button>

			<p>
				Please be aware! Pushing your stream to a malicious server could
				be harmful, leading to data leaks and key stoling.
				<br /> Only use servers you trust.
			</p>
		</div>
	)
}

export default NewRestreamServerForm
