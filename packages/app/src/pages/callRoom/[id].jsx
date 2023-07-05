import React from "react"
import { LiveChat } from "components"
import classnames from "classnames"
//import Peer from "peer"

import "./index.less"

export default class CallRoom extends React.Component {
    state = {
        participants: [],
    }

    peer = null

    viewsRef = React.createRef()

    selfVideoRef = React.createRef()

    componentDidMount = async () => {
        this.initialize()
    }

    initialize = async () => {
        const stream = await this.createMediaStream()

        this.selfVideoRef.current.srcObject = stream
    }

    async createMediaStream() {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: {

            },
        })

        return stream
    }

    render() {
        return <div className="room">
            <div
                className={classnames(
                    "room_views",
                    {
                        "one": this.state.participants.length === 0
                    }
                )}
                ref={this.viewsRef}
            >
                <div className="participant_video">
                    <video
                        autoPlay
                        muted
                        playsInline
                        ref={this.selfVideoRef}
                    />
                </div>

                {
                    this.state.participants.map((participant) => {
                        return <div className="participant_video">
                            <video
                                autoPlay
                                muted
                                playsInline
                                srcObject={participant.stream}
                            />
                        </div>
                    })
                }
            </div>

            <div className="text_room">
                <LiveChat
                    roomId={this.props.params.id}
                />
            </div>
        </div>
    }
}