import React from "react"

import { Icons } from "@components/Icons"

import useClickNavById from "@hooks/useClickNavById"

import "./index.less"

const SelectorPaths = {
	music: "/studio/music",
	tv: "/studio/tv",
	marketplace: "/studio/marketplace",
}

const StudioPage = () => {
	const [navigatorRef, navigatorProps] = useClickNavById(
		SelectorPaths,
		".studio-page-selectors-item",
	)

	return (
		<div className="studio-page">
			<div className="studio-page-header">
				<h1>Studio</h1>
			</div>

			<div
				className="studio-page-selectors"
				ref={navigatorRef}
				{...navigatorProps}
			>
				<div
					id="music"
					className="studio-page-selectors-item"
				>
					<Icons.Music2 />
					<span>Music</span>
				</div>

				<div
					id="tv"
					className="studio-page-selectors-item"
				>
					<Icons.MonitorPlay />
					<span>TV</span>
				</div>

				<div
					id="marketplace"
					className="studio-page-selectors-item"
				>
					<Icons.CodeXml />
					<span>Marketplace</span>
				</div>
			</div>
		</div>
	)
}

export default StudioPage
