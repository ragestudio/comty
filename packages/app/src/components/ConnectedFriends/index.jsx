import React from "react"

import User from "models/user"
import UserPreview from "components/UserPreview"

import "./index.less"

export default (props) => {
    const [connectedUsers, setConnectedUsers] = React.useState([])

    const fetchConnectedFriends = async () => {
        const result = await User.getConnectedUsersFollowing().catch((err) => {
            console.error(err)
            app.message.error("Failed to fetch connected friends")

            return null
        })

        if (result) {
            console.log(`Connected friends:`, result)
            setConnectedUsers(result)
        }
    }

    const wsEvents = {
        "friend.connected": (user_id) => {
            setConnectedUsers([...connectedUsers, user_id])
        },
        "friend.disconnected": (user_id) => {
            setConnectedUsers(connectedUsers.filter((id) => id !== user_id))
        }
    }

    React.useEffect(() => {
        fetchConnectedFriends()

        for (const [event, callback] of Object.entries(wsEvents)) {
            app.cores.api.listenEvent(event, callback)
        }

        return () => {
            for (const [event, callback] of Object.entries(wsEvents)) {
                app.cores.api.unlistenEvent(event, callback)
            }
        }
    }, [])

    return <div className="connectedFriends">
        {
            connectedUsers.length === 0 ?
                <span>No connected friends</span> :
                connectedUsers.map((user_id) => {
                    return <div className="item">
                        <UserPreview user_id={user_id} />
                    </div>
                })
        }
    </div>
}