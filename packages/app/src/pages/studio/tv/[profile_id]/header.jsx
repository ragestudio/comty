import React from "react"
import { FiEye, FiRadio } from "react-icons/fi"

const ProfileHeader = ({ profile, streamHealth }) => {
	const streamRef = React.useRef(streamHealth ?? {})
	const [thumbnail, setThumbnail] = React.useState(
		profile.info.offline_thumbnail,
	)

	async function setTimedThumbnail() {
		setThumbnail(() => {
			if (streamRef.current.online && profile.info.thumbnail) {
				return `${profile.info.thumbnail}?t=${Date.now()}`
			}

			return profile.info.offline_thumbnail
		})
	}

	React.useEffect(() => {
		streamRef.current = streamHealth
	}, [streamHealth])

	React.useEffect(() => {
		const timedThumbnailInterval = setInterval(setTimedThumbnail, 5000)

		return () => {
			clearInterval(timedThumbnailInterval)
		}
	}, [])

	return (
		<div className="profile-header">
			<img className="profile-header__image" src={thumbnail} />

			<div className="profile-header__content">
				<div className="profile-header__card titles">
					<h1
						style={{
							"--fontSize": "2rem",
							"--fontWeight": "800",
						}}
					>
						{profile.info.title}
					</h1>

					<h3
						style={{
							"--fontSize": "1rem",
						}}
					>
						{profile.info.description}
					</h3>
				</div>

				<div className="flex-row gap-10">
					{streamHealth?.online ? (
						<div className="profile-header__card on_live">
							<span>
								<FiRadio /> On Live
							</span>
						</div>
					) : (
						<div className="profile-header__card">
							<span>Offline</span>
						</div>
					)}

					<div className="profile-header__card viewers">
						<span>
							<FiEye />
							{streamHealth?.viewers}
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ProfileHeader
