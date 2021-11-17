import React from 'react'
import { Result, Button, Typography } from "antd"
import { CloseCircleOutlined } from "@ant-design/icons"

const { Paragraph, Text } = Typography

export default (props) => {
	let errors = []
	const getErrors = () => {
		return errors.map((err) => {
			if (err instanceof Error) {
				return (
					<Paragraph>
						<CloseCircleOutlined style={{
							color: "red",
							marginRight: "10px",
						}} />
						{err.toString()}
					</Paragraph>
				)
			}
			return <div></div>
		})
	}

	if (Array.isArray(props.error)) {
		errors = props.error
	} else {
		errors.push(props.error)
	}

	return (
		<div>
			<Result
				status="error"
				title="Render Error"
				subTitle="It seems that the application is having problems displaying this page, we have detected some unrecoverable errors due to a bug. (This error will be automatically reported to the developers to find a solution as soon as possible)"
			>
				<div className="desc">
					<Paragraph>
						<Text
							strong
							style={{
								fontSize: 16,
							}}
						>
							We have detected the following errors:
						</Text>
					</Paragraph>
					{getErrors()}
				</div>
			</Result>
		</div>
	)
}
