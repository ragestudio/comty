import React from "react"
import { Button, Tooltip, Badge, Dropdown } from "antd"
import { Icons } from "components/Icons"
import LiveChat from "components/LiveChat"
import classnames from "classnames"

import "./index.less"

const eventsToDispatch = {
    "kick": (user) => {
        app.cores.sync.music.moderation.kickUser(user.user_id)
    },
    "transfer_owner": (user) => {
        app.cores.sync.music.moderation.transferOwner(user.user_id)
    }
}

export default class SyncRoomCard extends React.Component {
    state = {
        roomData: {},
        socketLatency: null,
        owner: false,
        chatVisible: false,
        notReadedMessages: false,
    }

    latencyInterval = null

    roomEvents = {
        "room:joined": (data) => {
            this.setState({
                roomData: data,
            })
        },
        "room:current-data": (data) => {
            console.log(data)

            this.setState({
                roomData: data
            })
        }
    }

    chatEvents = {
        "room:recive:message": (data) => {
            if (!this.state.chatVisible) {
                this.setState({
                    notReadedMessages: true
                })
            }
        }
    }

    checkLatency = () => {
        const instance = app.cores.api.instance().wsInstances.music

        if (instance) {
            this.setState({
                socketLatency: instance.latency
            })
        }
    }

    componentDidMount = () => {
        Object.keys(this.roomEvents).forEach((event) => {
            app.cores.sync.music.eventBus.on(event, this.roomEvents[event])
        })

        // chat instance
        const chatInstance = app.cores.api.instance().wsInstances.chat

        if (chatInstance) {
            Object.keys(this.chatEvents).forEach((event) => {
                chatInstance.on(event, this.chatEvents[event])
            })
        }

        this.checkLatency()

        this.latencyInterval = setInterval(() => {
            this.checkLatency()
        }, 1000)
    }

    componentWillUnmount = () => {
        Object.keys(this.roomEvents).forEach((event) => {
            app.cores.sync.music.eventBus.off(event, this.roomEvents[event])
        })

        if (this.latencyInterval) {
            clearInterval(this.latencyInterval)
        }

        // chat instance
        const chatInstance = app.cores.api.instance().wsInstances.chat

        if (chatInstance) {
            Object.keys(this.chatEvents).forEach((event) => {
                chatInstance.off(event, this.chatEvents[event])
            })
        }
    }

    leaveRoom = () => {
        app.cores.sync.music.leaveRoom()
    }

    toggleChatVisibility = (to) => {
        if (typeof to !== "boolean") {
            to = !this.state.chatVisible
        }

        this.setState({
            chatVisible: to
        })

        if (this.state.notReadedMessages && to) {
            this.setState({
                notReadedMessages: false
            })
        }
    }

    generateUserMenu = (user) => {
        const isSelf = user.user_id === app.userData._id
        const imOwner = app.userData._id === this.state.roomData.ownerUserId

        const items = []

        if (!isSelf && imOwner) {
            items.push({
                key: "kick",
                label: <>
                    <Icons.MdLogout /> Kick
                </>,
            })

            items.push({
                key: "transfer_owner",
                label: <>
                    <Icons.Crown /> Transfer owner
                </>,
            })
        }

        return [
            {
                type: "group",
                label: `@${user.username}`,
                children: items,
            }
        ]
    }

    handleUserMenuClick = (event, user) => {
        const action = eventsToDispatch[event]

        if (typeof action === "function") {
            action(user)
        }
    }

    render() {
        return <>
            <div className="sync-room_subcard top">
                <div className="sync-room_name">
                    <span>
                        <Icons.MdSync /> {this.state.roomData?.options?.title ?? "Untitled room"}
                    </span>
                </div>

                <div className="sync-room_share_btns">
                    <Button
                        size="small"
                        icon={<Icons.MdShare />}
                        onClick={app.cores.sync.music.createInviteUserModal}
                    />

                    <Badge
                        dot={this.state.notReadedMessages}
                    >
                        <Button
                            size="small"
                            icon={<Icons.MdChat />}
                            onClick={this.toggleChatVisibility}
                        />
                    </Badge>
                </div>
            </div>

            <div className="sync-room_card">
                <div className="sync-room_users">
                    {
                        Array.isArray(this.state.roomData?.connectedUsers) && this.state.roomData?.connectedUsers.map((user, index) => {
                            return <Dropdown
                                menu={{
                                    items: this.generateUserMenu(user),
                                    onClick: (event) => {
                                        this.handleUserMenuClick(event.key, user)
                                    }
                                }}
                                trigger={["click"]}
                                placement="top"
                                arrow
                            >
                                <div className="sync-room_user" key={index}>
                                    {
                                        user.user_id === this.state.roomData.ownerUserId && <div className="ownerIcon">
                                            <Icons.Crown />
                                        </div>
                                    }
                                    <div className="sync-room_user_avatar">
                                        <img src={user.avatar} alt={user.username} />
                                    </div>
                                </div>
                            </Dropdown>
                        })
                    }
                </div>

                <div className="sync-room_actions">
                    <Button
                        type="primary"
                        onClick={this.leaveRoom}
                        size="small"
                        icon={<Icons.MdLogout />}
                        danger
                    />
                </div>

                <div className="latency_display">
                    <span>
                        {
                            app.cores.api.instance().wsInstances.music.latency ?? "..."
                        }ms
                    </span>
                </div>
            </div>

            <div
                className={classnames(
                    "sync-room_subcard bottom",
                    {
                        "hidden": !this.state.chatVisible
                    }
                )}
            >
                <LiveChat
                    room={this.state.roomData?.roomId}
                    compact
                />
            </div>
        </>
    }
}