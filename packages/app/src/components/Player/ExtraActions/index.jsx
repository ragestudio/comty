import React from "react"
import { Button } from "antd"

import { Icons } from "@components/Icons"
import LikeButton from "@components/LikeButton"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

const ExtraActions = (props) => {
	const [playerState] = usePlayerStateContext()

	const handleClickLike = async () => {
		if (!playerState.track_manifest) {
			console.error("Cannot like a track if nothing is playing")
			return false
		}

		const track = app.cores.player.track()

		await track.manifest.serviceOperations.toggleItemFavourite(
			"track",
			playerState.track_manifest._id,
		)
	}

	return (
		<div className="extra_actions">
			{app.isMobile && (
				<Button
					type="ghost"
					icon={<Icons.MdAbc />}
					disabled={!playerState.track_manifest?.lyrics_enabled}
				/>
			)}

			{!app.isMobile && (
				<LikeButton
					liked={
						playerState.track_manifest?.serviceOperations
							.fetchLikeStatus
					}
					onClick={handleClickLike}
					disabled={!playerState.track_manifest?._id}
				/>
			)}

			<Button type="ghost" icon={<Icons.MdQueueMusic />} />
		</div>
	)
}

export default ExtraActions
