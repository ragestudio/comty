import React from "react"
import Turnstile from "react-turnstile"

const CaptchaStepComponent = (props) => {
	const [sitekey, setSitekey] = React.useState(
		import.meta.env.VITE_TURNSTILE_SITEKEY,
	)

	React.useEffect(() => {
		fetch(app.cores.api.client().mainOrigin + "/main/turnstile").then(
			(res) => {
				if (res.ok) {
					res.json().then((data) => {
						setSitekey(data.siteKey)
					})
				}
			},
		)
	}, [])

	return (
		<Turnstile
			sitekey={sitekey}
			onVerify={(token) => {
				props.updateValue(token)
			}}
		/>
	)
}

export default {
	key: "captcha",
	title: "Step 4",
	icon: "FiLock",
	description:
		"We need you to prove that you are a human. Please enter the captcha below.",
	required: true,
	content: CaptchaStepComponent,
}
