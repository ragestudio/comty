import React from "react"
import { Result, Button, Typography } from "antd"
import { CloseCircleOutlined } from "@ant-design/icons"
import config from "config"

import "./index.less"

const { Paragraph, Text } = Typography

const ErrorEntry = (props) => {
	const { error } = props

	if (!error) {
		return <div className="error">
			<CloseCircleOutlined />
			Unhandled error
		</div>
	}

	return <div className="error">
		<CloseCircleOutlined />
		{error.info.toString()}
	</div>
}

export default (props) => {
	let errors = []

	if (Array.isArray(props.error)) {
		errors = props.error
	} else {
		errors.push(props.error)
	}

	const onClickGoMain = () => {
		window.app.setLocation(config.app.mainPath ?? "/main")
	}
	const onClickReload = () => {
		window.location.reload()
	}

	return (
		<div className="app_render_error">
			<Result
				status="error"
				title="Render Error"
				subTitle="It seems that the application is having problems displaying this page, we have detected some unrecoverable errors due to a bug. (This error should be automatically reported to the developers to find a solution as soon as possible)"
				extra={[
					<Button type="primary" key="gomain" onClick={onClickGoMain}>
						Go Main
					</Button>,
					<Button key="reload" onClick={onClickReload}>Reload</Button>,
				]}
			>
				<Paragraph>
					<Text
						strong
						style={{
							fontSize: 16,
						}}
					>
						We catch the following errors:
					</Text>
					<div className="errors">
						{errors.map((error, index) => {
							return <ErrorEntry key={index} error={error} />
						})}
					</div>
				</Paragraph>
			</Result>
		</div>
	)
}