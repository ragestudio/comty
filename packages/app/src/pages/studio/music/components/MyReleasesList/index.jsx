import React from "react"
import * as antd from "antd"

import ReleaseItem from "../ReleaseItem"

import MusicModel from "@models/music"

import "./index.less"

const MyReleasesList = () => {
	const [loading, response, error] = app.cores.api.useRequest(MusicModel.getMyReleases, {
		offset: 0,
		limit: 100,
	})

	const handleReleaseClick = React.useCallback((release) => {
		app.location.push(`/studio/music/release/${release._id}`)
	}, [])

	const renderContent = () => {
		if (loading) {
			return <antd.Skeleton active />
		}

		if (error) {
			return (
				<antd.Result
					status="warning"
					title="Failed to retrieve releases"
					subTitle={error.message}
				/>
			)
		}

		if (!response?.items?.length) {
			return <antd.Empty description="No releases found" />
		}

		return (
			<div className="music-studio-page-releases-list">
				{response.items.map((release) => (
					<ReleaseItem
						key={release._id}
						release={release}
						onClick={handleReleaseClick}
					/>
				))}
			</div>
		)
	}

	return (
		<div className="music-studio-page-content">
			<div className="music-studio-page-header">
				<h1>Your Releases</h1>
			</div>
			{renderContent()}
		</div>
	)
}

export default MyReleasesList
