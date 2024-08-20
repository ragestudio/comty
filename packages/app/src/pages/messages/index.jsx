import React from "react"
import * as antd from "antd"

import ChatsService from "@models/chats"

import TimeAgo from "@components/TimeAgo"
import Image from "@components/Image"

import "./index.less"

const ChatPreview = (props) => {
    const { chat } = props

    const previewUserId = chat.from_user_id === app.userData._id ? chat.to_user_id : chat.from_user_id

    return <div
        className="chat-preview"
        onClick={() => {
            app.location.push(`/messages/${previewUserId}`)
        }}
    >
        <div className="chat-preview-image">
            <Image
                src={chat.user.avatar}
            />
        </div>

        <div className="chat-preview-content">
            <div className="chat-preview-username">
                @{chat.user.username}
            </div>
            <div className="chat-preview-text" >
                <p>
                    {chat.content}
                </p>
            </div>
        </div>

        <div className="chat-preview-date">
            <span>
                <TimeAgo
                    time={chat.created_at}
                />
            </span>
        </div>
    </div>
}

const MessagesPage = (props) => {
    const [L_Recent, R_Recent, E_Recent, M_Recent] = app.cores.api.useRequest(ChatsService.getRecentChats)

    console.log(R_Recent, E_Recent)

    if (E_Recent) {
        return <antd.Result
            status="warning"
            title="Error"
            subTitle={E_Recent.message}
        />
    }

    if (L_Recent) {
        return <antd.Skeleton active />
    }

    return <div
        className="messages-page"
    >
        <h1>Recent Messages</h1>

        {
            R_Recent.map((chat) => {
                return <ChatPreview
                    key={chat._id}
                    chat={chat}
                />
            })
        }
    </div>
}

export default MessagesPage