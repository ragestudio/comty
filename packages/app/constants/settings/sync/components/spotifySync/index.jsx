import React from "react"

import { Button, Spin, Avatar, Modal } from "antd"
import { Icons } from "components/Icons"

import SyncModel from "models/sync"

import "./index.less"

export default (props) => {
    const onLogout = async () => {
        Modal.confirm({
            title: "Are you sure you want to logout?",
            content: "You will be logged out of your Spotify account",
            okText: "Logout",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                await SyncModel.spotifyCore.unlinkAccount()
                    .then(() => {
                        app.message.success("Successfully logged out of Spotify")
                    })
                    .catch((err) => {
                        console.error(err)
                        app.message.error("Failed to logout of Spotify")
                    })
            }
        })
    }

    if (props.ctx.spotifyAccount) {
        return <div className="spotifyAccount">
            <div className="spotifyAccount_info">
                <img
                    src={props.ctx.spotifyAccount.images[0].url}
                    alt="Spotify account avatar"
                />
                <p>
                    {
                        props.ctx.spotifyAccount.display_name
                    }
                </p>
            </div>

            <div className="spotifyAccount_actions">
                <Button
                    onClick={onLogout}
                    icon={<Icons.LogoutOutlined />}
                >
                    Logout
                </Button>
            </div>
        </div>
    }

    return <Button
        type="primary"
        onClick={SyncModel.spotifyCore.authorizeAccount}
    >
        Sync account
    </Button>
}