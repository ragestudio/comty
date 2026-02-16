import Button from "@ui/Button"
import { Icons } from "@components/Icons"

import "./index.less"

export default (props) => {
	return (
		<div className="reply_button">
			<Button
				type="ghost"
				onClick={props.onClick}
				icon={
					<Icons.Reply
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
