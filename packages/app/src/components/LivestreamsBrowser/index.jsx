import React from "react"
import * as antd from "antd"

import { UserPreview } from "components"
import { Icons } from "components/Icons"

import Livestream from "../../models/livestream"

import "./index.less"

const LivestreamItem = (props) => {
    const { livestream } = props

    const handleOnClick = async () => {
        if (typeof props.onClick !== "function") {
            console.warn("LivestreamItem: onClick is not a function")
            return
        }

        return await props.onClick(livestream)
    }

    return <div className="livestream_item" onClick={handleOnClick}>
        <div className="livestream_thumbnail">
            <img src={livestream.thumbnail ?? "/assets/new_file.png"} />
        </div>
        <div className="livestream_info">
            <UserPreview username={livestream.username} />

            <div className="livestream_description">
                {livestream.description ?? "No description"}
            </div>
        </div>
    </div>
}

export default (props) => {
    const [list, setList] = React.useState([])

    const loadStreamings = async () => {
        const livestreams = await Livestream.getLivestreams().catch((err) => {
            console.error(err)
            app.message.error("Failed to load livestreams")
            return false
        })

        console.log("Livestreams", livestreams)

        if (livestreams) {
            if (!Array.isArray(livestreams)) {
                console.error("Livestreams is not an array")
                return false
            }
            
            setList(livestreams)
        }
    }

    const onClickItem = async (livestream) => {
        app.setLocation(`/live/${livestream.username}`)
    }

    const renderList = () => {
        if (list.length === 0) {
            return <antd.Result>
                <h1>
                    No livestreams found
                </h1>
            </antd.Result>
        }

        return list.map((livestream) => {
            return <LivestreamItem livestream={livestream} onClick={onClickItem} />
        })
    }

    React.useEffect(() => {
        loadStreamings()
    }, [])

    return <div className="livestreamsBrowser">
        <div className="header">
            <h1>
                <Icons.Tv />
                <span>Livestreams</span>
            </h1>
        </div>

        <div className="livestream_list">
            {renderList()}
        </div>
    </div>
}
