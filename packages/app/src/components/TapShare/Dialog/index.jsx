import React from "react"
import * as antd from "antd"
import { Icons } from "components/Icons"

import UserCard from "components/UserCard"
import NFCModel from "comty.js/models/nfc"

import "./index.less"

const BehaviorTypeToAction = {
    "url": "Open an URL",
    "profile": "Open profile",
}

const handleAction = {
    "url": (value) => {
        window.location.href = value
    },
    "profile": (value) => {
        app.navigation.goToAccount(value)
    },
    "post": (value) => {
        app.message.error("Not supported yet")
    }
}

export default (props) => {
    const [L_Tag, R_Tag, E_Tag] = app.cores.api.useRequest(NFCModel.getTagBySerial, props.tag.serialNumber)

    if (L_Tag) {
        return <antd.Skeleton active />
    }

    if (!R_Tag || E_Tag) {
        return <antd.Result
            status="error"
            title="Something went wrong"
            subTitle="Sorry but we cannot find this NFC Tag"
        />
    }

    const onClick = (action) => {
        handleAction[action.type](action.value)

        props.close()
    }

    const actions = [
        R_Tag.behavior,
        {
            type: "profile",
            value: R_Tag.user.username
        }
    ]

    return <div className="nfc_tag_dialog">
        <div className="nfc_tag_dialog__header">
            <UserCard user={R_Tag.user} preview />
        </div>

        <div className="nfc_tag_dialog__body">
            <h2><Icons.MdTouchApp /> Choose a action</h2>

            {
                actions.map((action, index) => {
                    return <div
                        key={index}
                        className="nfc_tag_dialog__action"
                    >
                        <antd.Button
                            type="primary"
                            block
                            onClick={() => {
                                onClick(action)
                            }}
                        >
                            {
                                BehaviorTypeToAction[action.type]
                            }
                        </antd.Button>

                        <span className="nfc_tag_dialog__description">
                            {
                                action.value
                            }
                        </span>
                    </div>
                })
            }
        </div>
    </div>
}