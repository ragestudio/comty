import React from "react"

import { Button, Modal } from "antd"
import { Icons, createIconRender } from "@components/Icons"

import SyncModel from "@models/sync"

import "./index.less"

export default (props) => {
    const { namespace } = props

    const onUnlink = async () => {
        Modal.confirm({
            title: "Are you sure you want to unlink?",
            content: "The linked service will be unlinked from your account and you loose access to their features",
            okText: "Logout",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                await SyncModel.unlinkService(namespace)
                    .then(() => {
                        app.message.success("Successfully unlinked account")
                    })
                    .catch((err) => {
                        console.error(err)
                        app.message.error("Failed to unlink")
                    })
            }
        })
    }

    const onLink = async () => {
        const response = await SyncModel.linkService(namespace).catch((err) => {
            console.error(err)
            app.message.error(err.message)

            return null
        })

        if (!response) {
            return null
        }

        app.message.info("Successfully linked account")
    }

    if (!namespace) {
        return null
    }

    if (!props.ctx.processedCtx.publicData) {
        return null
    }

    if (props.ctx.processedCtx.publicData[namespace]) {
        return <div className="syncButton">
            <div className="syncButton_info">
                {
                    props.ctx.processedCtx.publicData[namespace].avatar
                        ? <img
                            src={props.ctx.processedCtx.publicData[namespace].avatar}
                            alt="Account avatar"
                        />
                        :

                        createIconRender(props.icon)
                }

                <p>
                    {
                        props.ctx.processedCtx.publicData[namespace].username
                    }
                </p>
            </div>

            <div className="syncButton_actions">
                <Button
                    onClick={onUnlink}
                    icon={<Icons.LogoutOutlined />}
                >
                    Unlink
                </Button>
            </div>
        </div>
    }

    return <Button
        type="primary"
        onClick={onLink}
    >
        Sync account
    </Button>
}