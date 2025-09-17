import React from "react"

import { Icons } from "@components/Icons"
import Image from "@components/Image"

import "./index.less"

const ReleaseItem = ({ release, onClick }) => {
	const handleClick = React.useCallback(() => {
		onClick?.(release)
	}, [onClick, release])

	const handleKeyDown = React.useCallback(
		(e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault()
				handleClick()
			}
		},
		[handleClick],
	)

	return (
		<div
			id={release._id}
			className="music-studio-page-release"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
			aria-label={`Open release ${release.title}`}
		>
			<div className="music-studio-page-release-title">
				<Image src={release.cover} />
				{release.title}
			</div>

			<div className="music-studio-page-release-info">
				<div className="music-studio-page-release-info-field">
					<Icons.Music2 />
					{release.type}
				</div>

				<div className="music-studio-page-release-info-field">
					<Icons.Tag />
					{release._id}
				</div>

				{/* <div className="music-studio-page-release-info-field">
                    <Icons.IoMdEye />
                    {release.analytics?.listen_count ?? 0}
                </div> */}
			</div>
		</div>
	)
}

export default ReleaseItem
