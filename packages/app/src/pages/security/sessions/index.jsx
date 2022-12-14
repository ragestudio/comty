import React from "react"
import * as antd from "antd"
import SessionModel from "models/session"
import moment from "moment"

import { Icons } from "components/Icons"

import "./index.less"

const SessionItem = (props) => {
    const { session } = props

    const [isCurrent, setIsCurrent] = React.useState(false)

    const onClickRevoke = () => {
        if (typeof props.onClickRevoke === "function") {
            props.onClickRevoke(session)
        }
    }

    React.useEffect(() => {
        const currentUUID = SessionModel.session_uuid

        if (currentUUID === session.session_uuid) {
            setIsCurrent(true)
        }
    }, [])

    return <div
        id={session._id}
        key={props.key}
        className="sessionItem"
    >
        <div className="sessionItem_info">
            <div className="sessionItem_info_title">
                <Icons.Tag /> <h3>{session.session_uuid}</h3>
                {
                    isCurrent && <antd.Badge dot>
                        Current
                    </antd.Badge>
                }
            </div>
            <div className="sessionItem_info_details">
                <div className="sessionItem_info_details_detail">
                    <Icons.Navigation /> <span>{session.location}</span>
                </div>
                <div className="sessionItem_info_details_detail">
                    <Icons.Clock />

                    <span>
                        {moment(session.date).format("DD/MM/YYYY HH:mm")}
                    </span>
                </div>
            </div>
        </div>
        <div className="sessionItem_actions">
            <antd.Button
                onClick={onClickRevoke}
                danger
            >
                Revoke
            </antd.Button>
        </div>
    </div>
}

export default () => {
    const [loading, setLoading] = React.useState(true)
    const [sessions, setSessions] = React.useState([])

    const loadSessions = async () => {
        setLoading(true)

        const response = await SessionModel.getAllSessions().catch((err) => {
            console.error(err)
            app.message.error("Failed to load sessions")
            return null
        })

        console.log(response)

        if (response) {
            setSessions(response)
        }

        setLoading(false)
    }

    const onClickRevoke = async (session) => {
        console.log(session)

        app.message.warning("Not implemented yet")
    }

    const onClickRevokeAll = async () => {
        app.message.warning("Not implemented yet")
    }

    React.useEffect(() => {
        loadSessions()
    }, [])

    if (loading) {
        return <antd.Skeleton active />
    }

    return <div className="sessions">
        <div className="sessions_header">
            <h1>Generated Sessions</h1>
            <antd.Button
                onClick={onClickRevokeAll}
                danger
            >
                Revoke all sessions
            </antd.Button>
        </div>

        <div className="sessions_list">
            {sessions.map((session, index) => {
                return <SessionItem
                    key={index}
                    session={session}
                    onClickRevoke={onClickRevoke}
                />
            })}
        </div>
    </div>
}