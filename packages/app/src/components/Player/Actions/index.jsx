import React from "react"
import { Button } from "antd"

import { Icons } from "@components/Icons"
import LikeButton from "@components/LikeButton"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

import "./index.less"

const ExtraActions = (props) => {
	const [trackInstance, setTrackInstance] = React.useState({})

	const onPlayerStateChange = React.useCallback((state) => {
		const instance = app.cores.player.track()

		if (instance) {
			setTrackInstance(instance)
		}
	}, [])

	const [playerState] = usePlayerStateContext(onPlayerStateChange)

	const handleClickLike = async () => {
		if (!trackInstance) {
			console.error("Cannot like a track if nothing is playing")
			return false
		}

		await trackInstance.manifest.serviceOperations.toggleItemFavourite(
			"track",
			trackInstance.manifest._id,
		)
	}

	return (
		<div className="player-actions">
			{app.isMobile && (
				<Button
					type="ghost"
					icon={<Icons.MdAbc />}
					disabled={!trackInstance?.manifest?.lyrics_enabled}
				/>
			)}

			{!app.isMobile && (
				<LikeButton
					liked={
						trackInstance?.manifest?.serviceOperations
							?.fetchLikeStatus
					}
					onClick={handleClickLike}
					disabled={!trackInstance?.manifest?._id}
				/>
			)}

			<Button type="ghost" icon={<Icons.MdQueueMusic />} />
		</div>
	)
}

export default ExtraActions
