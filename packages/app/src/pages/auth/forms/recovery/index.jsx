import React from "react"
import { Input } from "antd"

import FormWithSteps from "@components/FormWithSteps"
import AuthModel from "@models/auth"

const Steps = [
	{
		id: "email_input",
		render: ({ updateState, values }) => {
			function onChangeInput(e) {
				updateState("account", e.target.value)
			}

			return (
				<>
					<p>
						First enter your account or email address to find your
						associated account.
					</p>

					<Input
						placeholder="@username or email"
						value={values.account}
						onChange={onChangeInput}
						autoFocus
					/>
				</>
			)
		},
		validate: (values) => {
			return values.account && values.account.length > 3
		},
		onNext: async ({ values, updateState, setError }) => {
			try {
				const recoverSession = await AuthModel.recoverPassword(
					values.account,
				)

				updateState("recoverSession", recoverSession)
			} catch (error) {
				console.error(error.response.data)
				setError(error.response.data.error)

				return {
					cancel: true,
				}
			}
		},
	},
	{
		id: "new_password",
		render: ({ updateState, values }) => {
			return (
				<>
					<p>Enter a new password for your account.</p>

					<Input.Password
						placeholder="New Password"
						value={values.new_password}
						onChange={(e) =>
							updateState("new_password", e.target.value)
						}
						autoFocus
					/>
				</>
			)
		},
		validate: (values) => {
			if (!values.new_password) {
				return false
			}

			return values.new_password.length >= 8
		},
	},
	{
		id: "otp_input",
		render: ({ updateState, values }) => {
			return (
				<>
					<p>
						We've sent you a code to your email [
						{values.recoverSession.email}]
					</p>
					<p>Expires in {values.recoverSession.expires_in} minutes</p>

					<Input.OTP
						length={values.recoverSession.code_length}
						onChange={(value) => updateState("otp", value)}
						value={values.otp}
						autoFocus
					/>
				</>
			)
		},
		validate: (values) => {
			if (!values.otp) {
				return false
			}

			return values.otp.length === values.recoverSession.code_length
		},
	},
]

const OnFinish = async ({ values, setError }) => {
	try {
		const result = await AuthModel.changePassword({
			newPassword: values.new_password,
			code: values.otp,
			verificationToken: values.recoverSession.verificationToken,
		})

		app.message.info("Password changed successfully")
		app.navigation.goAuth()
	} catch (error) {
		console.error(error)
		setError(error.message)

		return {
			cancel: true,
		}
	}
}

const Header = () => {
	return (
		<div className="steped-form-header">
			<h1>Account Recovery</h1>
		</div>
	)
}

const RecoveryPage = (props) => {
	return (
		<FormWithSteps
			header={Header}
			steps={Steps}
			onCancel={() => {
				props.setActiveKey("selector")
			}}
			onFinish={OnFinish}
			cancelable
		/>
	)
}

export default RecoveryPage
