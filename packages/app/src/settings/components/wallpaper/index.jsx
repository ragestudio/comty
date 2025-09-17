import UrlInput from "../urlInput"
import BackgroundTweaker from "../backgroundTweaker"

export default (props) => {
	return (
		<div
			className="flex-column align-start gap-10"
			style={{ width: "100%" }}
		>
			<UrlInput
				{...props}
				style={{ width: "100%" }}
			/>
			<BackgroundTweaker style={{ width: "100%" }} />
		</div>
	)
}
