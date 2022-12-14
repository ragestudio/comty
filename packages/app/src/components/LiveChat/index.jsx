import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { io } from "socket.io-client"
import config from "config"
import SessionModel from "models/session"

import "./index.less"

const Line = (props) => {
    const { user, content } = props

    return <div className="textRoom_line">
        <div className="textRoom_line_user">
            <h4>{user.fullName ?? user.username}</h4>
        </div>
        <div className="textRoom_line_content">
            <span>{content}</span>
        </div>
    </div>
}
export default class LiveChat extends React.Component {
    state = {
        socket: null,
        connecting: true,
        connectionEnd: false,
        roomInfo: null,
        timeline: [],
        writtedMessage: "",
    }

    timelineRef = React.createRef()

    joinSocketRoom = async () => {
        await this.setState({ connecting: true })

        const { roomId } = this.props

        const socketNamespace = `/textRoom/${roomId}`

        console.log(`Joining socket room [${socketNamespace}]`)

        const socket = io(config.remotes.messagingApi, {
            transports: ["websocket"],
            autoConnect: false,
        })

        socket.auth = {
            token: SessionModel.token,
        }

        socket.on("connect_error", (err) => {
            console.error("Connection error", err)

            this.setState({ connectionEnd: true })

            if (err.message === "auth:token_invalid") {
                console.error("Invalid token")
            }
        })

        socket.on("connect", () => {
            socket.emit("join", { room: socketNamespace }, (error, info) => {
                if (error) {
                    this.setState({ connectionEnd: true })
                    return console.error("Error joining room", error)
                }

                this.setState({
                    connecting: false,
                    roomInfo: info,
                })
            })
        })

        socket.on("message", (message) => {
            this.pushToTimeline(message)
            this.scrollTimelineToBottom()
        })

        socket.connect()

        this.setState({ socket })
    }

    submitMessage = (message) => {
        const { socket } = this.state

        socket.emit("send:message", {
            message
        })

        this.scrollTimelineToBottom()

        // remove writted message
        this.setState({
            writtedMessage: ""
        })
    }

    pushToTimeline = (message) => {
        const { timeline } = this.state

        this.setState({
            timeline: [...timeline, message]
        })
    }

    handleInputChange = (e) => {
        this.setState({
            writtedMessage: e.target.value
        })
    }

    handleOnEnter = (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (e.target.value.length === 0) {
            return
        }

        this.submitMessage(e.target.value)
    }

    scrollTimelineToBottom = () => {
        // scroll to bottom smoothly
        this.timelineRef.current.scrollTo({
            top: this.timelineRef.current.scrollHeight,
            behavior: "smooth"
        })
    }

    componentDidMount = async () => {
        await this.joinSocketRoom()
    }

    componentWillUnmount() {
        this.state.socket.close()
    }

    render() {
        if (this.state.connectionEnd) {
            return <div className="liveChat">
                <antd.Result
                    status="error"
                    title="Connection error"
                    subTitle="Cannot connect to the server"
                />
            </div>
        }

        if (this.state.connecting) {
            return <div className="liveChat">
                <antd.Skeleton active />
            </div>
        }

        return <div
            className={classnames(
                "liveChat",
                { ["empty"]: this.state.timeline.length === 0 }
            )}
        >
            {
                this.state.timeline.length === 0 ?
                    <antd.Empty description="Welcome to the room" /> :
                    <div
                        className="liveChat_timeline"
                        ref={this.timelineRef}
                    >
                        {
                            this.state.timeline.map((line, index) => {
                                return <Line key={index} {...line} />
                            })
                        }
                    </div>
            }

            <div className="liveChat_textInput">
                <antd.Input.TextArea
                    placeholder="Type your message here"
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    value={this.state.writtedMessage}
                    onChange={this.handleInputChange}
                    onPressEnter={this.handleOnEnter}
                    maxLength={this.state.roomInfo?.limitations?.maxMessageLength ?? 100}
                    showCount
                />
            </div>
        </div>
    }
}