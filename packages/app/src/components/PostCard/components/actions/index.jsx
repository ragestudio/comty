import React from "react"
import * as antd from "antd"

import { Icons } from "components/Icons"

import SaveButton from "./saveButton"
import LikeButton from "./likeButton"

import "./index.less"

export default (props) => {
    const handleSelfMenuAction = async (event) => {
        const fn = props.actions[event.key]

        if (typeof fn === "function") {
            await fn()
        }
    }

    return <div className="post_actionsWrapper">
        <div className="actions">
            <div className="action" id="likes">
                <div className="icon">
                    <LikeButton defaultLiked={props.defaultLiked} onClick={props.onClickLike} />
                </div>
            </div>
            <div className="action" id="save">
                <div className="icon">
                    <SaveButton defaultActive={props.defaultSaved} onClick={props.onClickSave} />
                </div>
            </div>
            <div className="action" id="open" onClick={props.onClickOpen}>
                <div className="icon">
                    <Icons.MdOutlineOpenInNew className="icon" />
                </div>
            </div>
            {props.isSelf && <div className="action" id="selfMenu" onClick={props.onClickSelfMenu}>
                <antd.Dropdown
                    overlay={<antd.Menu
                        onClick={handleSelfMenuAction}
                    >
                        <antd.Menu.Item icon={<Icons.Edit />} key="edit">
                            Edit
                        </antd.Menu.Item>
                        <antd.Menu.Divider />
                        <antd.Menu.Item icon={<Icons.Trash />} key="delete">
                            Delete
                        </antd.Menu.Item>
                    </antd.Menu>}
                    trigger={["click"]}
                >
                    <div className="icon">
                        <Icons.MoreVertical />
                    </div>
                </antd.Dropdown>
            </div>}
        </div>
    </div>
}