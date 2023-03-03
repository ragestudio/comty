import React from "react"
import { Dropdown, Button } from "antd"
import { Icons } from "components/Icons"

import SaveButton from "./saveButton"
import LikeButton from "./likeButton"
import CommentsButton from "./commentsButton"

import "./index.less"

const MoreActionsItems = [
    {
        key: "repost",
        label: <>
            <Icons.Repeat />
            <span>Repost</span>
        </>,
    },
    {
        key: "share",
        label: <>
            <Icons.Share />
            <span>Share</span>
        </>,
    },
    {
        type: "divider",
    },
    {
        key: "report",
        label: <>
            <Icons.AlertTriangle />
            <span>Report</span>
        </>,
    },
]

export default (props) => {
    return <div className="post_actions_wrapper">
        <div className="actions">
            <div className="action" id="likes">
                <LikeButton
                    defaultLiked={props.defaultLiked}
                    onClick={props.onClickLike}
                    count={props.likesCount}
                />
            </div>
            <div className="action" id="save">
                <SaveButton
                    defaultActive={props.defaultSaved}
                    onClick={props.onClickSave}
                />
            </div>
            <div className="action" id="comments">
                <CommentsButton
                    onClickComments={props.onClickComments}
                    count={props.commentsCount}
                />
            </div>
            <div className="action" id="more">
                <Dropdown
                    menu={{
                        items: MoreActionsItems
                    }}
                    trigger={["click"]}
                >
                    <div className="icon">
                        <Icons.MoreHorizontal />
                    </div>
                </Dropdown>
            </div>
        </div>
    </div>
}