import React from "react"
import { Button } from "antd"

import { Icons } from "@components/Icons"
import LikeButton from "@components/LikeButton"

import { usePlayerStateContext } from "@contexts/WithPlayerContext"

import "./index.less"

const ExtraActions = (props) => {
	const [track, setTrack] = React.useState({})

	const onPlayerStateChange = React.useCallback((state) => {
		const track = app.cores.player.track()

		if (track) {
			setTrack(track)
		}
	}, [])

	usePlayerStateContext(onPlayerStateChange)

	const handleClickLike = async () => {
		if (!track) {
			console.error("Cannot like a track if nothing is playing")
			return false
		}

		await track.serviceOperations.toggleItemFavorite("tracks", track._id)
	}

	return (
		<div className="player-actions">
			{app.isMobile && (
				<Button
					type="ghost"
					icon={<Icons.ClosedCaption />}
					disabled={!track?.lyrics_enabled}
				/>
			)}

			{!app.isMobile && (
				<LikeButton
					liked={track?.serviceOperations?.isItemFavorited}
					onClick={handleClickLike}
					disabled={!track?._id}
				/>
			)}

			<Button
				type="ghost"
				icon={<Icons.ListMusic />}
			/>
		</div>
	)
}

export default ExtraActions
