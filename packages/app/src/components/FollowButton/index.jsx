import { Button } from "antd"
import classnames from "classnames"

import "./index.less"

const FollowButton = (props) => {
	return (
		<div className="followButton">
			<div className="counter">
				{props.count}
				{props.self && " Followers"}
			</div>

			{!props.self && (
				<Button
					type="ghost"
					onClick={props.onClick}
					className={classnames("btn", {
						["followed"]: props.followed,
					})}
				>
					<span>{props.followed ? "Following" : "Follow"}</span>
				</Button>
			)}
		</div>
	)
}

export default FollowButton
