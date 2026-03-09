import React from "react"

import "./index.less"

const ANIM_DURATION = 3000

const SkeletonRunRender = (props) => {
	const sfx = React.useRef(new Audio(new URL("./sfx.mp3", import.meta.url)))
	const body = React.useRef(null)
	const eyes = React.useRef(null)

	React.useEffect(() => {
		body.current.style.animationDuration = `${ANIM_DURATION / 3}ms`
		eyes.current.style.display = "none"

		sfx.current.currentTime = 0
		sfx.current.play()

		body.current.style.animationPlayState = "running"
		eyes.current.style.display = "block"

		setTimeout(() => {
			sfx.current.currentTime = 0
			sfx.current.pause()

			body.current.style.animationPlayState = "paused"
			eyes.current.style.display = "none"

			if (props.close) {
				props.close()
			}
		}, ANIM_DURATION)
	}, [])

	return (
		<>
			<div
				className="skeleton-run__eyes"
				ref={eyes}
			>
				<h1>👀</h1>
			</div>

			<div
				className="skeleton-run__body"
				ref={body}
			>
				<img src={new URL("./body.gif", import.meta.url)} />
			</div>
		</>
	)
}

const SkeletonRun = () => {
	app.cores.window_mng.render("skeleton-run", <SkeletonRunRender />, {
		className: "skeleton-run",
	})
}

export default SkeletonRun
