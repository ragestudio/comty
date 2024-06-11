import React from "react"
import * as antd from "antd"

import ReleaseItem from "@components/MusicStudio/ReleaseItem"

import MusicModel from "@models/music"

import "./index.less"

const MyReleasesList = () => {
    const [L_MyReleases, R_MyReleases, E_MyReleases, M_MyReleases] = app.cores.api.useRequest(MusicModel.getMyReleases, {
        offset: 0,
        limit: 100,
    })

    async function onClickReleaseItem(release) {
        app.location.push(`/studio/music/${release._id}`)
    }

    return <div className="music-studio-page-content">
        <div className="music-studio-page-header">
            <h1>Your Releases</h1>
        </div>

        {
            L_MyReleases && !E_MyReleases && <antd.Skeleton active />
        }
        {
            E_MyReleases && <antd.Result
                status="warning"
                title="Failed to retrieve releases"
                subTitle={E_MyReleases.message}
            />
        }
        {
            !L_MyReleases && !E_MyReleases && R_MyReleases && R_MyReleases.items.length === 0 && <antd.Empty />
        }

        {
            !L_MyReleases && !E_MyReleases && R_MyReleases && R_MyReleases.items.length > 0 && <div className="music-studio-page-releases-list">
                {
                    R_MyReleases.items.map((item) => {
                        return <ReleaseItem
                            key={item._id}
                            release={item}
                            onClick={onClickReleaseItem}
                        />
                    })
                }
            </div>
        }
    </div>
}

export default MyReleasesList