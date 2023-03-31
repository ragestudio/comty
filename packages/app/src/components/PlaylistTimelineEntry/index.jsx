import React from "react"
import { Button } from "antd"
import { Icons } from "components/Icons"
import UserPreview from "components/UserPreview"
import Image from "components/Image"

import "./index.less"

export default (props) => {
    const { data } = props

    return <div className="playlistTimelineEntry">
        <div className="playlistTimelineEntry_content">
            <div className="playlistTimelineEntry_thumbnail">
                <Image src={data.thumbnail} />
            </div>

            <div className="playlistTimelineEntry_info">
                <div className="playlistTimelineEntry_title">
                    <h1>
                        {data.title ?? "Untitled"}
                    </h1>
                </div>

                <div className="playlistTimelineEntry_description">
                    <p>
                        {data.description ?? "No description"}
                    </p>
                </div>

                <UserPreview
                    user_id={data.user_id}
                />
            </div>

            <div className="playlistTimelineEntry_actions">
                <div className="playlistTimelineEntry_action">
                    <Button
                        type="primary"
                        size="large"
                        icon={<Icons.Play />}
                    />
                </div>
            </div>
        </div>
    </div>
}