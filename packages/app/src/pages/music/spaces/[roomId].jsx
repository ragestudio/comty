import React from "react"
import config from "config"
import { io } from "socket.io-client"
import SessionModel from "models/session"

const remoteAddress = config.remotes.musicSpacesApi

export default class MusicSpaceRoom extends React.Component {
    state = {
        socket: null,
        connecting: true,
        connectionEnd: false,
        roomInfo: null,
    }

    joinEventRoom = async () => {
        console.log("Joining room", this.props.params.roomId,)

        const roomNs = `/room/${this.props.params.roomId}`

        const socket = io(remoteAddress, {
            transports: ["websocket"],
            autoConnect: false,
        })

        socket.auth = {
            token: SessionModel.token,
        }

        socket.on("connect_error", (err) => {
            this.setState({ connectionEnd: true })

            if (err.message === "auth:token_invalid") {
                console.error("Invalid token", err)
            } else {
                console.error("Connection error", err)
            }
        })

        socket.on("connect", () => {
            socket.emit("join", { 
                room: roomNs,
                type: "spotify",
             }, (error, info) => {
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

        socket.onAny((event, ...args) => {
            console.log(event, args)
        })

        socket.connect()

        this.setState({ socket })
    }

    componentDidMount() {
        this.joinEventRoom()
    }

    render() {
        return <div>
            {this.props.params.roomId}
        </div>
    }
}