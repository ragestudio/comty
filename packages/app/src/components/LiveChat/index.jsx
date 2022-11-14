import React from "react"
import * as antd from "antd"

import "./index.less"

const Line = (props) => {
    const { user, content, timestamp } = props

    return <div>
        {content}
    </div>
}

export default class LiveChat extends React.Component {
    state = {
        socket: null,
        timeline: [],
    }

    joinSocketRoom = () => {
        const { roomId } = this.props

        const socketNamespace = `/textRoom/${roomId}`

        console.log(`Joining socket room [${socketNamespace}]`)

        const socket = app.api.namespaces.main.wsInterface.manager.socket(socketNamespace)

        socket.connect()

        console.log("Socket", socket)

        socket.on("connect", () => {
            console.log("Socket connected")

            socket.on("message", (data) => {
                console.log("Message received", data)
            })
        })

        this.setState({ socket })
    }

    submitMessage = (message) => {
        const { socket } = this.state

        console.log("Sending message", message)

        socket.emit("message", message)
    }

    componentDidMount = async () => {
        await this.joinSocketRoom()
    }

    componentWillUnmount() {
        this.state.socket.close()
    }

    render() {
        return <div className="liveChat">
            {this.state.timeline.map((line, index) => <Line key={index} {...line} />)}

            <div className="textInput">
                <antd.Input.TextArea
                    placeholder="Type your message here"
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    onPressEnter={(e) => {
                        e.preventDefault()
                        e.stopPropagation()

                        console.log("Enter pressed", e.target.value)

                        this.submitMessage(e.target.value)
                    }}
                />
            </div>
        </div>
    }
}