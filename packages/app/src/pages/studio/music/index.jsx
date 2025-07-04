import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"

import MyReleasesList from "./components/MyReleasesList"

import "./index.less"

const MusicStudioPage = () => {
	return (
		<div className="music-studio-page">
			<div className="music-studio-page-header">
				<h1>Music Studio</h1>

				<antd.Button
					type="primary"
					icon={<Icons.FiPlusCircle />}
					onClick={() => {
						app.location.push("/studio/music/release/new")
					}}
				>
					New Release
				</antd.Button>
			</div>

			<MyReleasesList />
		</div>
	)
}

export default MusicStudioPage
