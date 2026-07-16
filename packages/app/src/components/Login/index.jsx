import React from "react"
import { Form, Input, Button, Alert } from "antd"
import classnames from "classnames"
import { Icons } from "@components/Icons"

import AuthModel from "@models/auth"
import config from "@config"

import "./index.less"

const STEPS_ON_ERROR = {
	username: "This username or email is not exist",
	password: "Password is incorrect",
}

const STEPS_VALIDATIONS = {
	username: async (username) => {
		const check = await AuthModel.usernameValidation(username).catch(
			() => ({ exists: false }),
		)

		return check.exists
	},
}

const PHASES_TO_STEPS = {
	0: "username",
	1: "password",
}

const Login = ({ close, onDone: onDoneProp, locked, unlock }) => {
	const [loading, setLoading] = React.useState(false)
	const [loginInputs, setLoginInputs] = React.useState({})
	const [error, setError] = React.useState(null)
	const [phase, setPhase] = React.useState(0)

	const [mfaRequired, setMfaRequired] = React.useState(null)
	const [activation, setActivation] = React.useState(null)
	const [forbidden, setForbidden] = React.useState(false)

	const formRef = React.useRef(null)
	const usernameInputRef = React.useRef(null)
	const passwordInputRef = React.useRef(null)
	const mfaCodeInputRef = React.useRef(null)

	const focusCurrentStep = React.useCallback(() => {
		const ref = mfaRequired
			? mfaCodeInputRef
			: phase === 0
				? usernameInputRef
				: passwordInputRef

		setTimeout(() => {
			ref.current?.focus?.()
		}, 100)
	}, [mfaRequired, phase])

	React.useEffect(() => {
		focusCurrentStep()
	}, [phase, mfaRequired, focusCurrentStep])

	const onDone = React.useCallback(
		async (result = {}) => {
			if (typeof close === "function") {
				await close({
					unlock: true,
				})
			}

			if (typeof onDoneProp === "function") {
				await onDoneProp(
					{ loginInputs, phase, mfaRequired, activation, forbidden },
					result,
				)
			}

			return true
		},
		[
			close,
			onDoneProp,
			loginInputs,
			phase,
			mfaRequired,
			activation,
			forbidden,
		],
	)

	const handleFinish = async () => {
		const payload = {
			username: loginInputs.username,
			password: loginInputs.password,
			mfa_code: loginInputs.mfa_code,
		}

		setError(null)
		setLoading(true)

		try {
			// AuthModel.login callback is called if mfa is required
			const result = await AuthModel.login(payload, async (res) => {
				if (res?.mfa_required) {
					// State update is scheduled
					setMfaRequired(res.mfa_required)
				}
			})

			// If we get a result (token), it's a success
			if (result && result.token) {
				await onDone(result)
			} else {
				// If result is false (MFA required) or no token, stop loading
				setLoading(false)
			}
		} catch (err) {
			setLoading(false)
			console.error("[Login] handleFinish catch:", err)

			if (err.response && err.response.data) {
				const data = err.response.data
				if (data.violation) {
					setForbidden(data.violation)
					return
				}

				if (data.activation_required) {
					setActivation({
						required: true,
						user_id: data.user_id,
					})
					return
				}

				setError(data.error || data.message || "An error occurred")
			} else {
				setError(err.message || "An error occurred")
			}
		}
	}

	const onUpdateInput = (input, value) => {
		if (input === "username") {
			value = value.toLowerCase().trim()
		}

		// remove error from ref
		formRef.current?.setFields([
			{
				name: input,
				errors: [],
			},
		])

		setLoginInputs((prev) => ({
			...prev,
			[input]: value,
		}))
	}

	const nextStep = async () => {
		if (mfaRequired) {
			return handleFinish()
		}

		const step = PHASES_TO_STEPS[phase]

		if (typeof STEPS_VALIDATIONS[step] === "function") {
			setLoading(true)
			const result = await STEPS_VALIDATIONS[step](loginInputs[step])
			setLoading(false)

			if (!result) {
				formRef.current?.setFields([
					{
						name: step,
						errors: [STEPS_ON_ERROR[step]],
					},
				])
				return false
			}
		}

		const to = phase + 1

		if (!PHASES_TO_STEPS[to]) {
			return handleFinish()
		}

		setPhase(to)
	}

	const prevStep = () => {
		if (mfaRequired) {
			setMfaRequired(null)
			loginInputs.mfa_code = null
			return
		}

		const to = phase - 1

		if (PHASES_TO_STEPS[to] === undefined) {
			return
		}

		setPhase(to)
	}

	const canNext = () => {
		if (loading) return false

		if (mfaRequired) {
			const code = loginInputs.mfa_code
			const requiredLength = mfaRequired.method === "totp" ? 6 : 4
			return code && code.length === requiredLength
		}

		const step = PHASES_TO_STEPS[phase]
		return !!loginInputs[step]
	}

	const onClickActivateAccount = async () => {
		if (!activation) return

		try {
			setLoading(true)
			await AuthModel.activateAccount(activation.user_id, activation.code)
			handleFinish()
		} catch (err) {
			setActivation((prev) => ({
				...prev,
				error: err,
			}))
			setLoading(false)
			console.error(err)
		}
	}

	const onClickResendActivationCode = async (e) => {
		e?.preventDefault()
		if (!activation) return

		try {
			const resendObj = await AuthModel.resendActivationCode(
				activation.user_id,
			)
			if (resendObj) {
				setActivation((prev) => ({
					...prev,
					resended: resendObj.date,
				}))
			}
		} catch (err) {
			if (typeof app !== "undefined") {
				app.message?.info(`Please try again later...`)
			}
			console.error(err)
		}
	}

	const onClickForgotPassword = () => {
		if (locked) {
			unlock()
		}
		if (typeof close === "function") {
			close()
		}
		if (typeof app !== "undefined") {
			app.location?.push("/auth?key=recover")
		}
	}

	if (forbidden) {
		return (
			<div className="login_wrapper">
				<div className="content">
					<h1>Access denied</h1>
					<h3>
						Your account has been disabled due a violation to our
						terms of service
					</h3>
					<div className="field-error">{forbidden.reason}</div>
					<p>If you think this is an error, please contact support</p>
				</div>
			</div>
		)
	}

	if (activation) {
		return (
			<div className="login_wrapper">
				<div className="content">
					<h1>Activate your Account</h1>
					<p>
						We have sent you an email with a code that you need to
						enter below.
					</p>

					<Input.OTP
						length={6}
						onChange={(code) =>
							setActivation((prev) => ({ ...prev, code }))
						}
					/>

					<div className="resend">
						{activation.resended && (
							<Alert
								message={`Mail resended`}
								type="success"
							/>
						)}
						<a
							href="#"
							onClick={onClickResendActivationCode}
						>
							Didn't receive the email?
						</a>
					</div>

					{activation.error && (
						<div className="field-error">
							{activation.error.response?.data?.error ||
								activation.error.message}
						</div>
					)}

					<Button
						onClick={onClickActivateAccount}
						loading={loading}
					>
						Activate
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="login_wrapper">
			<div className="content">
				<div className="header">
					<h1>Sign in</h1>
					<h3>To continue to {config.app.siteName}</h3>
				</div>

				<Form
					name="login"
					className="fields"
					autoCorrect="off"
					autoCapitalize="none"
					autoComplete="on"
					onFinish={handleFinish}
					ref={formRef}
				>
					<Form.Item
						name="username"
						// className={classnames("field", {
						// 	hidden: mfaRequired || phase !== 0,
						// })}
					>
						<span>
							<Icons.AtSign /> Username or Email
						</span>
						<Input
							ref={usernameInputRef}
							placeholder="myusername / myemail@example.com"
							onChange={(e) =>
								onUpdateInput("username", e.target.value)
							}
							onPressEnter={nextStep}
							autoFocus
						/>
					</Form.Item>

					<Form.Item
						name="password"
						className={classnames("field", {
							hidden: mfaRequired || phase !== 1,
						})}
					>
						<span>
							<Icons.SquareAsterisk /> Password
						</span>
						<Input.Password
							ref={passwordInputRef}
							onChange={(e) =>
								onUpdateInput("password", e.target.value)
							}
							onPressEnter={nextStep}
						/>
					</Form.Item>

					<Form.Item
						name="mfa_code"
						className={classnames("field", {
							hidden: !mfaRequired,
						})}
					>
						<span>
							<Icons.RectangleEllipsis /> Verification Code
						</span>

						{mfaRequired && (
							<div style={{ marginBottom: 10 }}>
								{mfaRequired.method === "totp" ? (
									<p>
										Enter the 6-digit code from your
										authenticator app.
									</p>
								) : (
									<>
										<p>
											We send a verification code to [
											{mfaRequired.sended_to}]
										</p>
										<p>
											Didn't receive the code?{" "}
											<a onClick={handleFinish}>Resend</a>
										</p>
									</>
								)}
							</div>
						)}

						<Input.OTP
							ref={mfaCodeInputRef}
							length={mfaRequired?.method === "totp" ? 6 : 4}
							formatter={(str) => str.toUpperCase()}
							onChange={(code) => onUpdateInput("mfa_code", code)}
							onPressEnter={nextStep}
						/>
					</Form.Item>
				</Form>

				<div className="component-row">
					{(phase > 0 || mfaRequired) && (
						<Button
							onClick={prevStep}
							disabled={loading}
						>
							Back
						</Button>
					)}
					<Button
						onClick={nextStep}
						disabled={!canNext() || loading}
						loading={loading}
					>
						Continue
					</Button>
				</div>

				{error && <div className="field-error">{error}</div>}

				<div
					className="field"
					onClick={onClickForgotPassword}
				>
					<a>Forgot your password?</a>
				</div>
			</div>
		</div>
	)
}

Login.pageStatement = {
	bottomBarAllowed: false,
}

export default Login
