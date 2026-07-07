import React from "react"
import * as antd from "antd"
import HiddenText from "@components/HiddenText"

import { Icons } from "@components/Icons"

const StreamConfiguration = ({ profile, loading, handleProfileUpdate }) => {
	return (
		<>
			<div className="profile-section content-panel">
				<div className="profile-section__header">
					<Icons.Router />
					<span>Server</span>
				</div>

				<div className="data-field">
					<div className="data-field__label">
						<span>Ingestion URL</span>
					</div>

					<div className="data-field__value">
						<code>
							<antd.Typography.Text
								copyable={{
									tooltips: ["Copied!"],
								}}
							>
								{`rtmp://${profile.urls?.public_host}`}
							</antd.Typography.Text>
						</code>
					</div>
				</div>

				<div className="data-field">
					<div className="data-field__label">
						<span>Stream Key</span>
					</div>

					<div className="data-field__value">
						<HiddenText
							value={`${profile._id}?token=${profile.token}`}
						/>
					</div>
				</div>
			</div>

			<div className="profile-section content-panel">
				<div className="profile-section__header">
					<Icons.MonitorCog />
					<span>Options</span>
				</div>

				<div className="data-field">
					<div className="data-field__label">
						<span>
							<Icons.EyeOff /> Private Mode
						</span>
					</div>
					<div className="data-field__description">
						<p>
							When this is enabled, only users with the livestream
							url can access the stream.
						</p>
					</div>
					<div className="data-field__content">
						<antd.Switch
							checked={profile.options.private}
							loading={loading}
							onChange={(checked) =>
								handleProfileUpdate("options", {
									...profile.options,
									private: checked,
								})
							}
						/>

						<p style={{ fontWeight: "bold" }}>
							Must restart the livestream to apply changes
						</p>
					</div>
				</div>

				<div className="data-field">
					<div className="data-field__label">
						<span>
							<Icons.CassetteTape />
							DVR [beta]
						</span>
					</div>
					<div className="data-field__description">
						<p>
							Save a copy of your stream with its entire duration.
							You can download this copy after finishing this
							livestream.
						</p>
					</div>
					<div className="data-field__content">
						<antd.Switch
							checked={profile.options.dvr}
							loading={loading}
							onChange={(checked) =>
								handleProfileUpdate("options", {
									...profile.options,
									dvr: checked,
								})
							}
							disabled
						/>
					</div>
				</div>
			</div>
		</>
	)
}

export default StreamConfiguration
