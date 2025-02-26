import React from "react"
import { Button } from "antd"
import { LuReply } from "react-icons/lu"

import "./index.less"

export default (props) => {
	return (
		<div className="reply_button">
			<Button
				type="ghost"
				shape="circle"
				onClick={props.onClick}
				icon={
					<LuReply
						style={{
							fontSize: "1rem",
							transform: "translateY(-1px)",
						}}
					/>
				}
			/>
			{props.count > 0 && (
				<span className="replies_count">{props.count}</span>
			)}
		</div>
	)
}
