import React from "react"
import * as antd from "antd"

import { PostCard, CommentsCard } from "components"

import "./index.less"

export default (props) => {
    const [data, setData] = React.useState(null)
    const post_id = props.match.params.post_id

    const loadData = async () => {
        setData(null)

        const data = await window.app.api.request("main", "get", `post`, undefined, {
            post_id
        })

        setData(data)
    }

    React.useEffect(() => {
        loadData()
    }, [])

    if (!data) {
        return <antd.Skeleton active />
    }

    return <div className="fullPost">
        <div className="postWrapper">
            <PostCard data={data} fullmode />
        </div>
        <div className="commentsWrapper">
            <CommentsCard post_id={data._id} />
        </div>
    </div>
}