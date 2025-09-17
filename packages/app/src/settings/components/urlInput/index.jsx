import React from "react"
import { Button, Input } from "antd"

import { Icons } from "@components/Icons"

import "./index.less"

export default (props) => {
	const [value, setValue] = React.useState(props.ctx.currentValue)

	React.useEffect(() => {
		setValue(props.ctx.currentValue)
	}, [props.ctx.currentValue])

	return (
		<div
			className="image-url-input"
			style={props.style}
		>
			{!props.noPreview && value && (
				<div className="image-url-input__preview">
					<img src={value} />
				</div>
			)}

			<Input.Group compact>
				<Input
					placeholder="Image URL..."
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onPressEnter={() => props.ctx.dispatchUpdate(value)}
				/>

				<Button
					icon={<Icons.Check />}
					onClick={() => props.ctx.dispatchUpdate(value)}
				/>
			</Input.Group>
		</div>
	)
}
