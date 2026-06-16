import React from "react"
import * as antd from "antd"
import Streaming from "@models/spectrum"

import { FiXCircle } from "react-icons/fi"
import NewRestreamServerForm from "./NewRestreamServerForm"

import ConfirmButton from "@ui/ConfirmButton"

const parseRestreamItem = (str) => {
	const parts = str.split("/")

	const key = parts.pop()
	const host = parts.join("/")

	return {
		key,
		host,
	}
}

const RestreamItem = ({ item, index, loading, onDelete }) => {
	const { host, key } = parseRestreamItem(item)

	return (
		<div
			className="restream-server-item"
			key={index}
		>
			<div className="data-field__label">
				<span style={{ userSelect: "all" }}>{host}</span>
				<p>{key ? key.replace(/./g, "*") : ""}</p>
			</div>

			<div className="data-field__actions">
				<ConfirmButton
					icon={<FiXCircle />}
					onConfirm={onDelete}
				/>
			</div>
		</div>
	)
}

// Component to manage restream settings
const RestreamManager = ({ profile, loading, handleProfileUpdate }) => {
	async function handleToggleRestreamEnabled(isEnabled) {
		await handleProfileUpdate("options", {
			...profile.options,
			restream: isEnabled,
		})
	}

	async function handleDeleteRestream(indexToDelete) {
		if (!profile || !profile._id) {
			antd.message.error("Profile not loaded. Cannot delete restream.")
			return
		}

		try {
			const updatedProfile = await Streaming.updateProfile(profile._id, {
				restreams: profile.restreams.filter(
					(_, index) => index !== indexToDelete,
				),
			})

			if (updatedProfile && updatedProfile.restreams) {
				handleProfileUpdate("restreams", updatedProfile.restreams)
				app.message.success("Restream server deleted successfully.")
			} else {
				app.message.error(
					"Failed to delete restream server: No profile data returned from API.",
				)
			}
		} catch (err) {
			console.error("Failed to delete restream server:", err)
			const errorMessage =
				err.response?.data?.message ||
				err.message ||
				"An unknown error occurred while deleting the restream server."
			antd.message.error(errorMessage)
		}
	}

	return (
		<>
			<div className="profile-section content-panel">
				<div className="content-panel__content">
					<div className="data-field">
						<div className="data-field__label">
							<span>Enable Restreaming</span>
							<p>
								Allow this stream to be re-broadcasted to other
								configured platforms.
							</p>
							<p style={{ fontWeight: "bold" }}>
								Only works if the stream is not in private mode.
							</p>
						</div>

						<div className="data-field__content">
							<antd.Switch
								checked={profile.options.restream}
								loading={loading}
								onChange={handleToggleRestreamEnabled}
							/>
							<p>Must restart the livestream to apply changes</p>
						</div>
					</div>
				</div>
			</div>

			{profile.options.restream && (
				<div className="profile-section content-panel">
					<div className="data-field__label">
						<span>Customs servers</span>
						<p>View or modify the list of custom servers.</p>
					</div>

					{profile.restreams.map((item, index) => (
						<RestreamItem
							item={item}
							index={index}
							onDelete={() => handleDeleteRestream(index)}
							loading={loading}
						/>
					))}

					{profile.restreams.length === 0 && (
						<div className="custom-list-empty">
							No restream servers configured.
						</div>
					)}
				</div>
			)}

			{profile.options.restream && (
				<NewRestreamServerForm
					profile={profile}
					loading={loading}
					handleProfileUpdate={handleProfileUpdate}
				/>
			)}
		</>
	)
}

export default RestreamManager
