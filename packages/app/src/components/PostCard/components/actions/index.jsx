import React from "react"

import { Icons } from "components/Icons"

import SaveButton from "./saveButton"
import LikeButton from "./likeButton"

import "./index.less"

export default (props) => {
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
            <div className="action" id="share">
                <div className="icon">
                    <Icons.Share2 onClick={props.onClickShare} />
                </div>
            </div>
            <div className="action" id="open" onClick={props.onClickOpen}>
                <div className="icon">
                    <Icons.MdOutlineOpenInNew className="icon" />
                </div>
            </div>
        </div>
    </div>
}