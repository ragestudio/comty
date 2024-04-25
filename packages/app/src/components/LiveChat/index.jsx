import React from "react"
import * as antd from "antd"
import classnames from "classnames"
import { TransitionGroup, CSSTransition } from "react-transition-group"

import SessionModel from "@models/session"

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
        joining: true,
        roomInfo: null,

        timeline: [],
        temporalTimeline: [],
        maxTemporalLines: this.props.maxTemporalLines ?? 10,

        lastSentMessage: null,
        writtedMessage: "",
    }

    debouncedIntervalTimelinePurge = null

    timelineRef = React.createRef()

    socket = app.cores.api.client().sockets.chats

    roomEvents = {
        "room:message": (message) => {
            if (message.content === this.state.lastSentMessage) {
                console.timeEnd("[CHATROOM] SUBMIT:MESSAGE")
            }

            this.pushToTimeline(message)
        },
        "room:joined": (info) => {
            console.log("[CHATROOM] Room joined", info)

            this.setState({
                joining: false,
                roomInfo: info,
            })
        },
        "room:leave": (info) => {
            console.log("[CHATROOM] Room left", info)

            this.setState({
                joining: true,
                roomInfo: null,
            })
        }
    }

    joinSocketRoom = async () => {
        if (!SessionModel.token) {
            return this.setState({
                noAuthed: true,
            })
        }
       
        console.log(`[CHATROOM] Joining socket room [${this.props.id}]...`)

        for (const [eventName, eventHandler] of Object.entries(this.roomEvents)) {
            this.socket.on(eventName, eventHandler)
        }

        await this.setState({
            joining: true,
        })

        this.socket.emit(
            "join:room",
            {
                room: this.props.id,
            },
            (error, info) => {
                if (error) {
                    this.setState({ connectionEnd: true })

                    return console.error("Error joining room", error)
                }
            }
        )
    }

    leaveSocketRoom = () => {
        if (this.state.connectionEnd) {
            return false
        }
        
        console.log(`[CHATROOM] Leaving socket room [${this.props.id}]...`)

        for (const [eventName, eventHandler] of Object.entries(this.roomEvents)) {
            this.socket.off(eventName, eventHandler)
        }

        this.socket.emit("leave:room")
    }

    submitMessage = (message) => {
        console.time("[CHATROOM] SUBMIT:MESSAGE")

        this.socket.emit("room:send:message", {
            message
        })

        // remove writted message
        this.setState({
            lastSentMessage: message,
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

        if (scrollingElement) {
            scrollingElement.scrollTo({
                top: scrollingElement.scrollHeight,
                behavior: "smooth"
            })
        }
    }

    componentDidMount = async () => {
        this.joinSocketRoom()

        app.ctx = {
            submit: this.submitMessage
        }
    }

    componentWillUnmount() {
        this.leaveSocketRoom()
        
        if (this.debouncedIntervalTimelinePurge) {
            clearInterval(this.debouncedIntervalTimelinePurge)
        }

        delete app.ctx
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

        if (this.state.noAuthed) {
            return <div className="liveChat empty">
                <antd.Empty description="You must be logged in to use this feature" />
            </div>
        }

        return <div
            className={classnames(
                "liveChat",
                {
                    ["empty"]: this.state.timeline.length === 0,
                    ["compact"]: this.props.compact
                }
            )}
        >
            {
                !this.props.compact && this.state.timeline.length === 0 && <antd.Empty description="Welcome to the room" />
            }

            {
                this.props.compact && this.state.timeline.length === 0 && <p>
                    Welcome to the room
                </p>
            }

            {
                this.state.timeline.length !== 0 && <div
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