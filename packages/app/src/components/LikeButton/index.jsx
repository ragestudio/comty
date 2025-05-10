import React from "react"
import classnames from "classnames"

import "./index.less"

const LikeButton = (props) => {
	const [liked, setLiked] = React.useState(
		typeof props.liked === "function" ? false : props.liked,
	)
	const [clicked, setClicked] = React.useState(false)

	async function computeLikedState() {
		if (props.disabled) {
			return false
		}

		if (typeof props.liked === "function") {
			let result = await props.liked()

			result = result.liked ?? result

			return setLiked(result)
		}

		return setLiked(props.liked)
	}

	const handleClick = () => {
		if (props.disabled) {
			return false
		}

		setClicked(true)

		setTimeout(() => {
			setClicked(false)
		}, 500)

		if (typeof props.onClick === "function") {
			props.onClick(!liked)
		}

		setLiked(!liked)
	}

	React.useEffect(() => {
		computeLikedState()
	}, [props.liked])

	return (
		<button
			className={classnames("likeButton", {
				["liked"]: liked,
				["clicked"]: clicked,
				["disabled"]: props.disabled,
			})}
			onClick={handleClick}
		>
			{!!props.ripple && <div className="ripple" />}
			<svg className="heart" viewBox="0 0 24 24">
				<path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"></path>
			</svg>
		</button>
	)
}

export default LikeButton
