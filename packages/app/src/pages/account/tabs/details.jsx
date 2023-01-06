import React from "react"
import moment from "moment"

import { Icons } from "components/Icons"

export default React.memo((props) => {
    return <div id="details" className="details">
        {
            props.state.user.fullName &&
            <div>
                <h2>{props.state.user.fullName}</h2>
            </div>
        }
        <div>
            <h3>
                @{props.state.user.username} #{props.state.user._id}
            </h3>
        </div>
        {
            props.state.user.description &&
            <div>
                <h4>
                    {props.state.user.description}
                </h4>
            </div>
        }
        {
            props.state.user.roles.includes("admin") &&
            <div>
                <span><Icons.MdAdminPanelSettings /> Administrators Team</span>
            </div>
        }
        <div>
            <span><Icons.Users /> {props.state.followers.length} Followers</span>
        </div>
        {
            props.state.user?.badges.length > 0 &&
            <div>
                <span><Icons.Award /> {props.state.user?.badges.length} Badges collected</span>
            </div>
        }
        <div>
            <span><Icons.Calendar /> Joined at {moment(new Date(Number(props.state.user.createdAt))).format("YYYY")}</span>
        </div>
    </div>
})