import React from "react"
import * as antd from "antd"
import SessionModel from "models/session"

import SessionItem from "../sessionItem"

import "./index.less"

export default () => {
    const [loading, setLoading] = React.useState(true)
    const [sessions, setSessions] = React.useState([])
    const [sessionsPage, setSessionsPage] = React.useState(1)
    const [itemsPerPage, setItemsPerPage] = React.useState(3)

    const loadSessions = async () => {
        setLoading(true)

        const response = await SessionModel.getAllSessions().catch((err) => {
            console.error(err)
            app.message.error("Failed to load sessions")
            return null
        })

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

    const offset = (sessionsPage - 1) * itemsPerPage
    const slicedItems = sessions.slice(offset, offset + itemsPerPage)

    return <div className="security_sessions">
        <div className="security_sessions_list">
            {
                slicedItems.map((session) => {
                    return <SessionItem
                        key={session._id}
                        session={session}
                        onClickRevoke={onClickRevoke}
                    />
                })
            }

            <antd.Pagination
                onChange={(page) => {
                    setSessionsPage(page)
                }}
                total={sessions.length}
                showTotal={(total) => {
                    return `${total} Sessions`
                }}
                simple
            />
        </div>
    </div>
}