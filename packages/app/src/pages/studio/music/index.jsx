import React from "react"
import * as antd from "antd"

import { Icons } from "@components/Icons"

import MyReleasesList from "@components/MusicStudio/MyReleasesList"

import "./index.less"

const ReleasesAnalytics = () => {
    return <div>
        <h1>Analytics</h1>
    </div>   
}

const MusicStudioPage = (props) => {
    return <div
        className="music-studio-page"
    >
        <div className="music-studio-page-header">
            <h1>Music Studio</h1>

            <antd.Button
                type="primary"
                icon={<Icons.FiPlusCircle />}
                onClick={() => {
                    app.location.push("/studio/music/new")
                }}
            >
                New Release
            </antd.Button>
        </div>

        <ReleasesAnalytics />

        <MyReleasesList />
    </div>
}

export default MusicStudioPage