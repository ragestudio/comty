import React from "react"
import * as antd from "antd"
import HiddenText from "../../components/HiddenText"

import { IoMdEyeOff } from "react-icons/io"
import { GrStorage, GrConfigure } from "react-icons/gr"
import { MdOutlineWifiTethering } from "react-icons/md"

const StreamConfiguration = ({ profile, loading, handleProfileUpdate }) => {
	return (
		<>
			<div className="profile-section content-panel">
				<div className="profile-section__header">
					<MdOutlineWifiTethering />
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
								{profile.urls?.ingest
									? profile.urls.ingest.split("?")[0]
									: "No URL"}
							</antd.Typography.Text>
						</code>
					</div>
				</div>

				<div className="data-field">
					<div className="data-field__label">
						<span>Stream Key</span>
					</div>

					<div className="data-field__value">
						<HiddenText value={`?token=${profile.token}`} />
					</div>
				</div>
			</div>

			<div className="profile-section content-panel">
				<div className="profile-section__header">
					<GrConfigure />
					<span>Options</span>
				</div>

				<div className="data-field">
					<div className="data-field__label">
						<span>
							<IoMdEyeOff /> Private Mode
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
							<GrStorage />
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
