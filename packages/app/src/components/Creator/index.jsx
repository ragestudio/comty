import React from "react"
import { Button } from "antd"
import { Icons, createIconRender } from "components/Icons"

import PostCreator from "./creators/post"
import PlaylistCreator from "./creators/playlist"
import VideoCreator from "./creators/video"

import "./index.less"

const CreatorsTypes = {
    post: {
        label: "Text Post",
        icon: "FileText",
        component: PostCreator
    },
    playlist: {
        label: "Playlist",
        icon: "Music",
        component: PlaylistCreator
    },
    video: {
        label: "Video",
        icon: "Video",
        component: VideoCreator,
        disabled: true
    }
}

export default class Creator extends React.Component {
    state = {
        type: null
    }

    handleCreatorType = (type) => {
        this.setState({ type })
    }

    renderCreator = (...props) => {
        if (!this.state.type) {
            return <div className="typeSelector">
                {Object.keys(CreatorsTypes).map((type) => {
                    const { label, icon = "PlusCircle" } = CreatorsTypes[type]

                    return <Button
                        key={type}
                        className="typeButton"
                        disabled={CreatorsTypes[type].disabled}
                        icon={createIconRender(icon)}
                        onClick={() => this.handleCreatorType(type)}
                    >
                        {label}
                    </Button>
                })}
            </div>
        }

        if (!CreatorsTypes[this.state.type]) {
            return <div className="content">
                <h1>Creator not found</h1>
            </div>
        }

        return React.createElement(CreatorsTypes[this.state.type].component, this.props)
    }

    render() {
        return <div className="creator">
            <div className="header">
                <h1><Icons.Box /> Creator</h1>
                {!this.state.type ? <p><Icons.MdInfoOutline /> Select an type to start creating...</p> : <div>
                    <Button icon={<Icons.ChevronLeft />} onClick={() => this.handleCreatorType()}>
                        Back
                    </Button>
                </div>}
            </div>

            {this.renderCreator()}
        </div>
    }
}