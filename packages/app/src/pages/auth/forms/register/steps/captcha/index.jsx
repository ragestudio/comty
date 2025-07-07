import Turnstile from "react-turnstile"

const CaptchaStepComponent = (props) => {
	return (
		<Turnstile
			sitekey={import.meta.env.VITE_TURNSTILE_SITEKEY}
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
