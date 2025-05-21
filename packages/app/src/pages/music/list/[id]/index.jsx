import React from "react"
import * as antd from "antd"

import PlaylistView from "@components/Music/PlaylistView"

import MusicService from "@models/music"

import "./index.less"

const ListView = (props) => {
	const { id } = props.params

	const query = new URLSearchParams(window.location.search)
	const type = query.get("type")
	const service = query.get("service")

	const [loading, result, error] = app.cores.api.useRequest(
		MusicService.getReleaseData,
		id,
		{
			type: type,
			service: service,
		},
	)

	if (error) {
		return (
			<antd.Result
				status="warning"
				title="Error"
				subTitle={error.message}
			/>
		)
	}

	if (loading) {
		return <antd.Skeleton active />
	}

	console.log(result)

	return (
		<PlaylistView
			playlist={result}
			centered={app.isMobile}
			hasMore={false}
		/>
	)
}

export default ListView
