import React from "react"
import * as antd from "antd"
import classnames from "classnames"

import UserPreview from "@components/UserPreview"

import useChat from "@hooks/useChat"
import ChatsService from "@models/chats"

import lodash from "lodash"

import "./index.less"

const ChatPage = (props) => {
    const { to_user_id } = props.params

    const messagesRef = React.useRef()

    const [isOnBottomView, setIsOnBottomView] = React.useState(true)
    const [currentText, setCurrentText] = React.useState("")

    const [L_History, R_History, E_History, M_History] = app.cores.api.useRequest(ChatsService.getChatHistory, to_user_id)

    const {
        sendMessage,
        messages,
        setMessages,
        setScroller,
        emitTypingEvent,
        isRemoteTyping,
    } = useChat(to_user_id)

    async function submitMessage() {
        if (!currentText) {
            return false
        }

        await sendMessage(currentText)

        setCurrentText("")
    }

    async function onInputChange(e) {
        const value = e.target.value

        setCurrentText(value)

        if (value === "") {
            emitTypingEvent(false)
        } {
            emitTypingEvent(true)
        }
    }

    React.useEffect(() => {
        if (R_History) {
            setMessages(R_History.list)
            // scroll to bottom
            messagesRef.current?.scrollTo({
                top: messagesRef.current.scrollHeight,
                behavior: "smooth",
            })
        }
    }, [R_History])

    React.useEffect(() => {
        if (isOnBottomView === true) {
            setScroller(messagesRef)
        } else {
            setScroller(null)
        }
    }, [isOnBottomView])

    if (E_History) {
        return <antd.Result
            status="warning"
            title="Error"
            subTitle={E_History.message}
        />
    }

    if (L_History) {
        return <antd.Skeleton active />
    }

    return <div
        className="chat-page"
    >
        <div className="chat-page-header">
            <UserPreview
                user_id={to_user_id}
            />

            {
                isRemoteTyping && <p>Typing...</p>
            }
        </div>

        <div
            className={classnames(
                "chat-page-messages",
                {
                    ["empty"]: messages.length === 0
                }
            )}
            ref={messagesRef}
        >
            {
                messages.length === 0 && <antd.Empty />
            }

            {
                messages.map((line, index) => {
                    return <div
                        key={index}
                        className={classnames(
                            "chat-page-line-wrapper",
                            {
                                ["self"]: line.user._id === app.userData._id
                            }
                        )}
                    >
                        <div className="chat-page-line">
                            <div
                                className="chat-page-line-avatar"
                            >
                                <img
                                    src={line.user.avatar}
                                />
                                <span>
                                    {line.user.username}
                                </span>
                            </div>

                            <div
                                className="chat-page-line-text"
                            >
                                <p>
                                    {line.content}
                                </p>
                            </div>
                        </div>
                    </div>
                })
            }
        </div>

        <div className="chat-page-input-wrapper">
            <div className="chat-page-input">
                <antd.Input
                    placeholder="Enter message"
                    value={currentText}
                    onChange={onInputChange}
                    onPressEnter={submitMessage}
                />
            </div>
        </div>
    </div>
}

export default ChatPage