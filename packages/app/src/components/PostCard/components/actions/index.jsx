import React from "react"
import { Dropdown, Button } from "antd"
import { Icons } from "components/Icons"

import SaveButton from "./saveButton"
import LikeButton from "./likeButton"
import CommentsButton from "./commentsButton"

import "./index.less"

const SelfActionsItems = [
    {
        key: "onClickEdit",
        label: <>
            <Icons.Edit />
            <span>Edit</span>
        </>,
    },
    {
        key: "onClickDelete",
        label: <>
            <Icons.Trash />
            <span>Delete</span>
        </>,
    },
    {
        type: "divider",
    },
]

const MoreActionsItems = [
    {
        key: "onClickRepost",
        label: <>
            <Icons.Repeat />
            <span>Repost</span>
        </>,
    },
    {
        key: "onClickShare",
        label: <>
            <Icons.Share />
            <span>Share</span>
        </>,
    },
    {
        type: "divider",
    },
    {
        key: "onClickReport",
        label: <>
            <Icons.AlertTriangle />
            <span>Report</span>
        </>,
    },
]

export default (props) => {
    const [isSelf, setIsSelf] = React.useState(false)

    const {
        onClickLike,
        onClickSave,
        onClickComments,
    } = props.actions ?? {}

    const genItems = () => {
        let items = MoreActionsItems

        if (isSelf) {
            items = [...SelfActionsItems, ...items]
        }

        return items
    }

    const handleDropdownClickItem = (e) => {
        if (typeof props.actions[e.key] === "function") {
            props.actions[e.key]()
        }
    }

    return <div className="post_actions_wrapper">
        <div className="actions">
            <div className="action" id="likes">
                <LikeButton
                    defaultLiked={props.defaultLiked}
                    count={props.likesCount}
                    onClick={onClickLike}
                />
            </div>
            <div className="action" id="save">
                <SaveButton
                    defaultActive={props.defaultSaved}
                    onClick={onClickSave}
                />
            </div>
            <div className="action" id="comments">
                <CommentsButton
                    count={props.commentsCount}
                    onClick={onClickComments}
                />
            </div>
            <div className="action" id="more">
                <Dropdown
                    menu={{
                        items: genItems(),
                        onClick: handleDropdownClickItem,
                    }}
                    trigger={["click"]}
                    onOpenChange={(open) => {
                        if (open && props.user_id) {
                            const isSelf = app.cores.permissions.checkUserIdIsSelf(props.user_id)

                            setIsSelf(isSelf)
                        }
                    }}
                    overlayStyle={{
                        minWidth: "200px",
                    }}
                >
                    <div className="icon">
                        <Icons.MoreHorizontal />
                    </div>
                </Dropdown>
            </div>
        </div>
    </div>
}