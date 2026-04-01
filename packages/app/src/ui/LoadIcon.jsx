import UseAnimations from "react-useanimations"
import loadingAnim from "react-useanimations/lib/loading"

import "./LoadIcon.less"

const LoadIcon = () => {
	return (
		<UseAnimations
			animation={loadingAnim}
			strokeColor="currentColor"
			render={(eventProps, animationProps) => {
				return (
					<div
						className="load-icon-spinner"
						ref={animationProps.ref}
					/>
				)
			}}
		/>
	)
}

export default LoadIcon
