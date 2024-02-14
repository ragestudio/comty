import React from "react"
import { Icons } from "components/Icons"
import * as antd from "antd"

import "./index.less"

const ChatLine = (props) => {
    const { user, content } = props

    return <div className="chat_line">
        <div className="chat_line_user">
            <h4>{user.fullName ?? user.username}</h4>
        </div>
        <div className="chat_line_content">
            <span>{content}</span>
        </div>
    </div>
}

export const Chat = (props) => {
    const { chat_id } = props
    const [timeline, setTimeline] = React.useState([])

    return <div className="chat">
        <span>
            {
                chat_id
            }
        </span>

        <div className="chat_timeline">
            {
                timeline.map((line, index) => {
                    return <ChatLine
                        key={index}
                        {...line}
                    />
                })
            }
        </div>
    </div>
}

export const Chats = (props) => {
    const { chat_id } = props.params

    return <div className="chats_dashboard">
        <div className="chats_dashboard_header">
            {
                chat_id && <antd.Button
                    icon={<Icons.MdArrowBack />}
                />
            }
            <h1>Chats</h1>
        </div>

        <div className="chats_dashboard_content">
            {
                chat_id && <Chat
                    chat_id={chat_id}
                />
            }
            {
                !chat_id && <div>
                    <h1>Select a chat</h1>
                </div>
            }
        </div>
    </div>
}

export default Chats