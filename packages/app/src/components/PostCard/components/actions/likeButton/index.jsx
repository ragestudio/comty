import React from "react"
import classnames from "classnames"
import CountUp from "react-countup"

import "./index.less"

const LikeButtonAction = (props) => {
	const [liked, setLiked] = React.useState(props.defaultLiked ?? false)
	const [clicked, setCliked] = React.useState(false)

	const handleClick = async () => {
		let to = !liked

		setCliked(to)

		if (typeof props.onClick === "function") {
			const result = await props.onClick(to)

			if (typeof result === "boolean") {
				to = result
			}
		}

		setLiked(to)
	}

	return (
		<div
			className={classnames("like_btn_wrapper", {
				["liked"]: liked,
				["clicked"]: clicked,
			})}
			onClick={handleClick}
		>
			<button className="like_btn">
				<div className="ripple"></div>
				<svg
					className="heart"
					width="24"
					height="24"
					viewBox="0 0 24 24"
				>
					<path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"></path>
				</svg>
			</button>
			<CountUp
				start={props.count}
				separator="."
				end={props.count}
				startOnMount={false}
				duration={3}
				className="count"
				useEasing={true}
			/>
		</div>
	)
}

export default LikeButtonAction
