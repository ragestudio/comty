import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { io } from "socket.io-client"
import { TransitionGroup, CSSTransition } from "react-transition-group"

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
        temporalTimeline: [],
        writtedMessage: "",
        maxTemporalLines: this.props.maxTemporalLines ?? 10,
    }

    debouncedIntervalTimelinePurge = null

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
        })

        socket.connect()

        this.setState({ socket })
    }

    submitMessage = (message) => {
        const { socket } = this.state

        socket.emit("send:message", {
            message
        })

        // remove writted message
        this.setState({
            writtedMessage: ""
        })
    }

    pushToTimeline = (message) => {
        const { timeline } = this.state

        if (typeof message.key === "undefined") {
            message.key = this.state.timeline.length
        }

        this.setState({
            timeline: [...timeline, message]
        })

        if (this.props.floatingMode) {
            if (this.state.temporalTimeline.length >= this.state.maxTemporalLines) {
                this.setState({
                    temporalTimeline: this.state.temporalTimeline.slice(1)
                })
            }

            // calculate duration based on message length (Minimum 3 second, maximum 10 seconds)
            const calculatedDuration = Math.min(Math.max(message.content.length * 0.1, 3), 10) * 1000

            const temporalLine = {
                expireTime: Date.now() + calculatedDuration,
                duration: calculatedDuration,
                messageKey: message.key
            }

            this.setState({
                temporalTimeline: [...this.state.temporalTimeline, temporalLine]
            })

            if (this.debouncedIntervalTimelinePurge) {
                clearInterval(this.debouncedIntervalTimelinePurge)
            }

            this.debouncedIntervalTimelinePurge = setInterval(this.purgeLastTemporalLine, 3000)
        }

        this.scrollTimelineToBottom()
    }

    purgeLastTemporalLine = () => {
        if (!this.props.floatingMode) {
            return false
        }

        const { temporalTimeline } = this.state

        if (temporalTimeline.length === 0) {
            clearInterval(this.debouncedIntervalTimelinePurge)
            return false
        }

        const lastTemporalLine = temporalTimeline[0]

        if (lastTemporalLine.expireTime < Date.now()) {
            this.setState({
                temporalTimeline: temporalTimeline.slice(1)
            })
        }
    }

    handleInputChange = (e) => {
        if (e.target.value[0] === " " || e.target.value[0] === "\n") {
            e.target.value = e.target.value.slice(1)
        }

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
        const scrollingElement = document.getElementById("liveChat_timeline")

        console.log(`Scrolling to bottom`, scrollingElement)

        if (scrollingElement) {
            scrollingElement.scrollTo({
                top: scrollingElement.scrollHeight,
                behavior: "smooth"
            })
        }
    }

    componentDidMount = async () => {
        await this.joinSocketRoom()

        app.ctx = {
            submit: this.submitMessage
        }
    }

    componentWillUnmount() {
        this.state.socket.close()

        if (this.debouncedIntervalTimelinePurge) {
            clearInterval(this.debouncedIntervalTimelinePurge)
        }
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

        if (this.props.floatingMode) {
            return <div className="liveChat floating">
                <TransitionGroup
                    ref={this.timelineRef}
                    className="liveChat_timeline"
                    id="liveChat_timeline"
                >
                    {
                        this.state.temporalTimeline.map((line, index) => {
                            return <CSSTransition
                                key={index}
                                timeout={300}
                                classNames={{
                                    enterActive: "transverse-enter",
                                    exitActive: "transverse-out"
                                }}
                            >
                                <Line {...this.state.timeline[line.messageKey]} />
                            </CSSTransition>
                        })
                    }
                </TransitionGroup>
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
                        id="liveChat_timeline"
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