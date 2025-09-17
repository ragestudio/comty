import React from "react"
import * as antd from "antd"

import AuthModel from "@models/auth"

const isValidEmailFormat = (email) => {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const EmailStepComponent = (props) => {
	const [email, setEmail] = React.useState(props.currentValue ?? "")

	const [loading, setLoading] = React.useState(false)
	const [validFormat, setValidFormat] = React.useState(null)
	const [emailAvailable, setEmailAvailable] = React.useState(null)

	const isValid = () => {
		return email.length > 0 && validFormat && emailAvailable
	}

	const submit = () => {
		if (!isValid()) {
			return false
		}

		props.onPressEnter()
	}

	const handleUpdate = (e) => {
		setEmail(e.target.value)
	}

	React.useEffect(() => {
		props.updateValue(null)
		setEmailAvailable(null)
		setValidFormat(null)

		const validFormat = isValidEmailFormat(email)
		setValidFormat(validFormat)

		if (email.length === 0 || !validFormat) {
			return
		}

		setLoading(true)

		// check if email is available
		const timer = setTimeout(async () => {
			const request = await AuthModel.availability({ email }).catch(
				(error) => {
					antd.message.error(
						`Cannot check email availability: ${error.message}`,
					)

					return false
				},
			)

			if (request) {
				setEmailAvailable(!request.exists)

				if (request.exists) {
					antd.message.error("Email is already in use")
					props.updateValue(null)
				} else {
					props.updateValue(email)
				}
			}

			setLoading(false)
		}, 1000)

		return () => clearTimeout(timer)
	}, [email])

	return (
		<div className="register_form_step_content">
			<antd.Input
				defaultValue={props.currentValue}
				placeholder="Email"
				onPressEnter={submit}
				onChange={handleUpdate}
				status={
					email.length == 0
						? "default"
						: loading
							? "default"
							: isValid()
								? "success"
								: "error"
				}
			/>
		</div>
	)
}

export default {
	key: "email",
	title: "Step 3",
	icon: "FiMail",
	description:
		"Enter a email for the account, it can be used to access to your account. \n Will not be shared with anyone else and not be used for marketing purposes.",
	required: true,
	content: EmailStepComponent,
}
