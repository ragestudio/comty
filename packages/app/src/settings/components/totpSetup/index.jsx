import React from "react"
import * as antd from "antd"
import Button from "@ui/Button"
import { Icons } from "@components/Icons"

import UserModel from "@models/user"

import "./index.less"
import SelectableText from "@/components/SelectableText"

export const TOTPSetupComponent = ({ close, resolve }) => {
	const [loading, setLoading] = React.useState(false)
	const [step, setStep] = React.useState("initial") // initial, generate, enable
	const [qrData, setQrData] = React.useState(null)
	const [code, setCode] = React.useState("")
	const [error, setError] = React.useState(null)

	const handleGenerate = async () => {
		setLoading(true)
		setError(null)
		try {
			const data = await UserModel.generateTotp()
			setQrData(data)
			setStep("generate")
		} catch (err) {
			setError(
				err.response?.data?.error || "Failed to generate TOTP secret",
			)
		} finally {
			setLoading(false)
		}
	}

	const handleEnable = async () => {
		if (code.length !== 6) return
		setLoading(true)
		setError(null)
		try {
			await UserModel.enableTotp(code)

			if (app.userData) {
				app.userData.flags = [...(app.userData.flags || []), "has_totp"]
			}

			app.message.success("2FA enabled successfully")

			if (typeof resolve === "function") {
				resolve()
			}

			if (typeof close === "function") {
				close()
			}
		} catch (err) {
			setError(err.response?.data?.error || "Invalid verification code")
		} finally {
			setLoading(false)
		}
	}

	if (step === "initial") {
		return (
			<div className="totp-setup">
				<div className="totp-setup__header">
					<h1>
						<Icons.Smartphone /> App Authenticator
					</h1>
					<p>
						Secure your account using a Time-based One-Time Password
						(TOTP) from an app like Google Authenticator or Authy.
					</p>
				</div>

				<Button
					type="primary"
					onClick={handleGenerate}
					loading={loading}
				>
					Setup Authenticator
				</Button>
			</div>
		)
	}

	if (step === "generate") {
		return (
			<div className="totp-setup">
				<div className="totp-setup__header">
					<h1>Setup Authenticator</h1>
					<p>Scan the QR code below with your authenticator app.</p>
				</div>

				<div className="totp-setup__qr-container">
					{qrData?.qrCodeUrl && (
						<img
							src={qrData.qrCodeUrl}
							alt="TOTP QR Code"
						/>
					)}
				</div>

				<div className="totp-setup__manual-secret">
					<span>Or enter this code manually:</span>
					<SelectableText>{qrData?.secret}</SelectableText>
				</div>

				<div className="totp-setup__verification">
					<p>Enter the 6-digit code from your app to verify:</p>

					<antd.Input.OTP
						length={6}
						onChange={setCode}
					/>

					{error && (
						<div className="totp-setup__verification__error-message">
							{error}
						</div>
					)}

					<Button
						type="primary"
						onClick={handleEnable}
						loading={loading}
						disabled={code.length !== 6}
					>
						Verify and Enable
					</Button>
				</div>
			</div>
		)
	}

	return null
}

export const TOTPDisableComponent = ({ close, resolve, reject }) => {
	const [loading, setLoading] = React.useState(false)
	const [code, setCode] = React.useState("")
	const [error, setError] = React.useState(null)

	const handleDisable = async () => {
		setLoading(true)
		setError(null)

		try {
			await UserModel.disableTotp(code)

			if (app.userData?.flags) {
				app.userData.flags = app.userData.flags.filter(
					(f) => f !== "has_totp",
				)
			}
			app.message.success("2FA disabled successfully")

			if (typeof resolve === "function") {
				resolve()
			}

			if (typeof close === "function") {
				close()
			}
		} catch (err) {
			setError(err.response?.data?.error || "Failed to disable 2FA")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="totp-setup">
			<div className="totp-setup__header">
				<h1>
					<Icons.ShieldOff />
					Disable 2FA
				</h1>

				<p>
					Are you sure you want to disable App Authenticator 2FA? This
					will make your account less secure.
				</p>
			</div>

			<div className="totp-setup__verification">
				<p>Enter your 6-digit authentication code to confirm:</p>
				<antd.Input.OTP
					length={6}
					onChange={setCode}
				/>
				{error && (
					<div className="totp-setup__verification__error-message">
						{error}
					</div>
				)}
				<Button
					type="danger"
					onClick={handleDisable}
					loading={loading}
					disabled={code.length !== 6}
				>
					Disable 2FA
				</Button>
			</div>
		</div>
	)
}
