import React from "react"

import { Skeleton } from "antd"
import { Icons } from "@components/Icons"
import PostsModel from "@models/post"

import "./index.less"

const TrendingsCard = (props) => {
    const [L_Trendings, R_Trendings, E_Trendings] = app.cores.api.useRequest(PostsModel.getTrendings)

    return <div className="card">
        <div className="card-header">
            <h1><Icons.IoMdTrendingUp /> Trendings</h1>
        </div>

        <div className="card-content trendings">
            {
                L_Trendings && <Skeleton active />
            }
            {
                E_Trendings && <span>Something went wrong</span>
            }
            {
                !L_Trendings && !E_Trendings && R_Trendings && R_Trendings.map((trending, index) => {
                    return <div
                        key={index}
                        className="trending"
                        onClick={() => window.app.location.push(`/trending/${trending.hashtag}`)}
                    >
                        <div className="trending-level">
                            <span>#{index + 1} {trending.hashtag}</span>
                        </div>

                        <div className="trending-info">
                            <span>{trending.count} posts</span>
                        </div>
                    </div>
                })
            }
        </div>
    </div>
}

export default TrendingsCard