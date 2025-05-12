import { Button, Input, Statistic, Tag } from "antd"
import UploadButton from "@components/UploadButton"

import { FiImage, FiInfo } from "react-icons/fi"
import { MdTextFields, MdDescription } from "react-icons/md"

import StreamPreview from "../../components/StreamPreview"
import StreamRateChart from "../../components/StreamRateChart"
import { formatBytes, formatBitrate } from "../../liveTabUtils"
import { useStreamSignalQuality } from "../../useStreamSignalQuality"

import "./index.less"

const MAX_DATA_POINTS = 30 // Approx 30 seconds of data (if 1 point per second)
const Y_AXIS_MAX_TARGET_KBPS = 14000

const Live = ({ profile, loading, handleProfileUpdate, streamHealth }) => {
	const [newTitle, setNewTitle] = React.useState(profile.info.title)
	const [newDescription, setNewDescription] = React.useState(
		profile.info.description,
	)
	const [streamData, setStreamData] = React.useState([])

	const targetMaxBitrateBpsForQuality = React.useMemo(
		() => (Y_AXIS_MAX_TARGET_KBPS * 1000) / 8,
		[],
	)

	const signalQualityInfo = useStreamSignalQuality(
		streamHealth,
		targetMaxBitrateBpsForQuality,
	)

	React.useEffect(() => {
		if (
			streamHealth &&
			signalQualityInfo.currentReceivedRateBps !== undefined &&
			signalQualityInfo.currentSentRateBps !== undefined
		) {
			const newPoint = {
				time: new Date(),
				sentRate: signalQualityInfo.currentSentRateBps,
				receivedRate: signalQualityInfo.currentReceivedRateBps,
			}

			setStreamData((prevData) =>
				[...prevData, newPoint].slice(-MAX_DATA_POINTS),
			)
		}
	}, [
		streamHealth,
		signalQualityInfo.currentSentRateBps,
		signalQualityInfo.currentReceivedRateBps,
	])

	async function saveProfileInfo() {
		handleProfileUpdate("info", {
			title: newTitle,
			description: newDescription,
		})
	}

	return (
		<div className="profile-section live-tab-layout">
			<div className="profile-section content-panel live-tab-info">
				<div className="profile-section__header">
					<span>
						<FiInfo /> Information
					</span>
				</div>
				<div className="content-panel__content">
					<div className="data-field">
						<div className="data-field__label">
							<span>
								<MdTextFields /> Title
							</span>
						</div>
						<div className="data-field__value">
							<Input
								placeholder="Title this livestream"
								defaultValue={profile.info.title}
								onChange={(e) => setNewTitle(e.target.value)}
								maxLength={50}
								showCount
							/>
						</div>
					</div>

					<div className="data-field">
						<div className="data-field__label">
							<span>
								<MdDescription /> Description
							</span>
						</div>
						<div className="data-field__value">
							<Input
								placeholder="Describe this livestream in a few words"
								defaultValue={profile.info.description}
								onChange={(e) =>
									setNewDescription(e.target.value)
								}
								maxLength={200}
								showCount
							/>
						</div>
					</div>

					<div className="data-field">
						<div className="data-field__label">
							<span>
								<FiImage /> Offline Thumbnail
							</span>
							<p>Displayed when the stream is offline</p>
						</div>
						<div className="data-field__content">
							<UploadButton
								accept="image/*"
								onUploadDone={(response) => {
									handleProfileUpdate("info", {
										...profile.info,
										offline_thumbnail: response.url,
									})
								}}
								children={"Update"}
							/>
						</div>
					</div>

					<Button
						type="primary"
						onClick={saveProfileInfo}
						loading={loading}
						disabled={
							profile.info.title === newTitle &&
							profile.info.description === newDescription
						}
					>
						Save
					</Button>
				</div>
			</div>

			<div className="live-tab-grid">
				<div className="content-panel">
					<div className="content-panel__header">
						Live Preview & Status
					</div>
					<div className="content-panel__content">
						<div className="status-indicator">
							Stream Status:
							{streamHealth?.online ? (
								<Tag color="green">Online</Tag>
							) : (
								<Tag color="red">Offline</Tag>
							)}
						</div>

						<div className="live-tab-preview">
							{streamHealth?.online ? (
								<StreamPreview
									streamHealth={streamHealth}
									profile={profile}
								/>
							) : (
								"Stream is Offline"
							)}
						</div>
					</div>
				</div>

				<div className="content-panel">
					<div className="content-panel__header">
						<div className="flex-row gap-10">
							<p>Network Stats</p>

							<Tag color={signalQualityInfo.color || "blue"}>
								{signalQualityInfo.status}
							</Tag>
						</div>

						<span className="status-indicator__message">
							{signalQualityInfo.message}
						</span>
					</div>

					<div className="content-panel__content">
						<div className="live-tab-stats">
							<div className="live-tab-stat">
								<Statistic
									title="Total Sent"
									value={streamHealth?.bytesSent || 0}
									formatter={formatBytes}
								/>
							</div>
							<div className="live-tab-stat">
								<Statistic
									title="Total Received"
									value={streamHealth?.bytesReceived || 0}
									formatter={formatBytes}
								/>
							</div>
							<div className="live-tab-stat">
								<Statistic
									title="Bitrate (Sent)"
									value={
										streamData.length > 0
											? streamData[streamData.length - 1]
													.sentRate
											: 0
									}
									formatter={formatBitrate}
								/>
							</div>
							<div className="live-tab-stat">
								<Statistic
									title="Bitrate (Received)"
									value={
										streamData.length > 0
											? streamData[streamData.length - 1]
													.receivedRate
											: 0
									}
									formatter={formatBitrate}
								/>
							</div>
						</div>
						<div className="live-tab-chart">
							<StreamRateChart streamData={streamData} />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Live
