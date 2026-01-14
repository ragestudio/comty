import React, { useEffect, useRef, useCallback, useMemo } from "react"

import "./index.less"

const ANIMATION_CONFIG = {
	SMOOTH_DURATION: 600,
	INITIAL_DURATION: 1500,
	INITIAL_X_OFFSET: 70,
	INITIAL_Y_OFFSET: 60,
}

const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max)

const round = (value, precision = 3) => parseFloat(value.toFixed(precision))

const adjust = (value, fromMin, fromMax, toMin, toMax) =>
	round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin))

const easeInOutCubic = (x) =>
	x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2

const ProfileCardComponent = ({
	avatarUrl,
	iconUrl,
	themeColor,

	title = "",
	username = "",
	followersText = "",

	enableTilt = true,
	enableMobileTilt = false,
	mobileTiltSensitivity = 5,
}) => {
	const wrapRef = useRef(null)
	const cardRef = useRef(null)
	const calibrationRef = useRef({ beta: null, gamma: null })

	const animationHandlers = useMemo(() => {
		if (!enableTilt) {
			return null
		}

		let rafId = null

		const updateCardTransform = (offsetX, offsetY, card, wrap) => {
			const width = card.clientWidth
			const height = card.clientHeight

			const percentX = clamp((100 / width) * offsetX)
			const percentY = clamp((100 / height) * offsetY)

			const centerX = percentX - 50
			const centerY = percentY - 50

			const properties = {
				"--pointer-x": `${percentX}%`,
				"--pointer-y": `${percentY}%`,
				"--background-x": `${adjust(percentX, 0, 100, 35, 65)}%`,
				"--background-y": `${adjust(percentY, 0, 100, 35, 65)}%`,
				"--pointer-from-center": `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
				"--pointer-from-top": `${percentY / 100}`,
				"--pointer-from-left": `${percentX / 100}`,
				"--rotate-x": `${round(-(centerX / 5))}deg`,
				"--rotate-y": `${round(centerY / 4)}deg`,
			}

			Object.entries(properties).forEach(([property, value]) => {
				wrap.style.setProperty(property, value)
			})
		}

		const createSmoothAnimation = (
			duration,
			startX,
			startY,
			card,
			wrap,
		) => {
			const startTime = performance.now()
			const targetX = wrap.clientWidth / 2
			const targetY = wrap.clientHeight / 2

			const animationLoop = (currentTime) => {
				const elapsed = currentTime - startTime
				const progress = clamp(elapsed / duration)
				const easedProgress = easeInOutCubic(progress)

				const currentX = adjust(easedProgress, 0, 1, startX, targetX)
				const currentY = adjust(easedProgress, 0, 1, startY, targetY)

				updateCardTransform(currentX, currentY, card, wrap)

				if (progress < 1) {
					rafId = requestAnimationFrame(animationLoop)
				}
			}

			rafId = requestAnimationFrame(animationLoop)
		}

		return {
			updateCardTransform,
			createSmoothAnimation,
			cancelAnimation: () => {
				if (rafId) {
					cancelAnimationFrame(rafId)
					rafId = null
				}
			},
		}
	}, [enableTilt])

	const handlePointerMove = useCallback(
		(event) => {
			const card = cardRef.current
			const wrap = wrapRef.current

			if (!card || !wrap || !animationHandlers) {
				return null
			}

			const rect = card.getBoundingClientRect()

			animationHandlers.updateCardTransform(
				event.clientX - rect.left,
				event.clientY - rect.top,
				card,
				wrap,
			)
		},
		[animationHandlers],
	)

	const handlePointerEnter = useCallback(() => {
		const card = cardRef.current
		const wrap = wrapRef.current

		if (!card || !wrap || !animationHandlers) {
			return null
		}

		animationHandlers.cancelAnimation()
		wrap.classList.add("active")
		card.classList.add("active")
	}, [animationHandlers])

	const handlePointerLeave = useCallback(
		(event) => {
			const card = cardRef.current
			const wrap = wrapRef.current

			if (!card || !wrap || !animationHandlers) {
				return null
			}

			animationHandlers.createSmoothAnimation(
				ANIMATION_CONFIG.SMOOTH_DURATION,
				event.offsetX,
				event.offsetY,
				card,
				wrap,
			)
			wrap.classList.remove("active")
			card.classList.remove("active")
		},
		[animationHandlers],
	)

	const handleDeviceOrientation = useCallback(
		(event) => {
			const card = cardRef.current
			const wrap = wrapRef.current
			const calibration = calibrationRef.current

			if (!card || !wrap || !animationHandlers) {
				return null
			}

			const { beta, gamma } = event

			if (beta === null || gamma === null) {
				return null
			}

			// Apply calibration offset
			const calibratedBeta = beta - calibration.beta
			const calibratedGamma = gamma - calibration.gamma

			// Calculate tilt values
			const tiltX =
				card.clientWidth / 2 - calibratedGamma * mobileTiltSensitivity
			const tiltY =
				card.clientHeight / 2 + calibratedBeta * mobileTiltSensitivity

			animationHandlers.updateCardTransform(tiltX, tiltY, card, wrap)
		},
		[animationHandlers, mobileTiltSensitivity],
	)

	useEffect(() => {
		if (!enableTilt || !animationHandlers) {
			return null
		}

		const card = cardRef.current
		const wrap = wrapRef.current

		if (!card || !wrap) {
			return null
		}

		const isMobile =
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent,
			)

		const pointerMoveHandler = handlePointerMove
		const pointerEnterHandler = handlePointerEnter
		const pointerLeaveHandler = handlePointerLeave
		const deviceOrientationHandler = handleDeviceOrientation

		// handle mobile device orientation permissions and setup
		const setupDeviceOrientation = () => {
			if (!enableMobileTilt || location.protocol !== "https:") return
			if (
				typeof window.DeviceMotionEvent.requestPermission === "function"
			) {
				window.DeviceMotionEvent.requestPermission()
					.then((state) => {
						if (state === "granted") {
							console.debug(
								"device orientation permission granted",
							)
						}
					})
					.catch((err) => console.error(err))
			}
		}

		// mobile press handlers with calibration
		const handlePress = () => {
			if (!isMobile || !enableMobileTilt) return

			// reset calibration first
			calibrationRef.current = { beta: null, gamma: null }

			const calibrateOrientation = (event) => {
				const { beta, gamma } = event
				if (beta === null || gamma === null) return

				if (calibrationRef.current.beta === null) {
					calibrationRef.current = {
						beta: beta,
						gamma: gamma,
					}

					window.removeEventListener(
						"deviceorientation",
						calibrateOrientation,
					)
					window.addEventListener(
						"deviceorientation",
						deviceOrientationHandler,
					)
				}
			}

			window.addEventListener("deviceorientation", calibrateOrientation)

			wrap.classList.add("active")
			card.classList.add("active")
		}

		const handlePressEnd = () => {
			if (!isMobile || !enableMobileTilt) {
				return null
			}

			window.removeEventListener(
				"deviceorientation",
				deviceOrientationHandler,
			)

			wrap.classList.remove("active")
			card.classList.remove("active")

			// reset calibration
			calibrationRef.current = { beta: null, gamma: null }

			// reset card position
			animationHandlers.createSmoothAnimation(
				ANIMATION_CONFIG.SMOOTH_DURATION,
				wrap.clientWidth / 2,
				wrap.clientHeight / 2,
				card,
				wrap,
			)
		}

		if (isMobile) {
			card.addEventListener("touchstart", handlePress)
			card.addEventListener("touchend", handlePressEnd)
			card.addEventListener("click", setupDeviceOrientation)
		} else {
			card.addEventListener("pointerenter", pointerEnterHandler)
			card.addEventListener("pointermove", pointerMoveHandler)
			card.addEventListener("pointerleave", pointerLeaveHandler)
		}

		const initialX = wrap.clientWidth - ANIMATION_CONFIG.INITIAL_X_OFFSET
		const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET

		animationHandlers.updateCardTransform(initialX, initialY, card, wrap)
		animationHandlers.createSmoothAnimation(
			ANIMATION_CONFIG.INITIAL_DURATION,
			initialX,
			initialY,
			card,
			wrap,
		)

		return () => {
			if (isMobile) {
				card.removeEventListener("touchstart", handlePress)
				card.removeEventListener("touchend", handlePressEnd)
				card.removeEventListener("click", setupDeviceOrientation)
				window.removeEventListener(
					"deviceorientation",
					deviceOrientationHandler,
				)
			} else {
				card.removeEventListener("pointerenter", pointerEnterHandler)
				card.removeEventListener("pointermove", pointerMoveHandler)
				card.removeEventListener("pointerleave", pointerLeaveHandler)
			}

			animationHandlers.cancelAnimation()
		}
	}, [
		enableTilt,
		enableMobileTilt,
		animationHandlers,
		handlePointerMove,
		handlePointerEnter,
		handlePointerLeave,
		handleDeviceOrientation,
	])

	const cardStyle = useMemo(
		() => ({
			"--icon": iconUrl ? `url(${iconUrl})` : "none",
			"--theme-color": themeColor,
		}),
		[iconUrl, themeColor],
	)

	return (
		<div
			ref={wrapRef}
			className="profile-card-wrapper"
			style={cardStyle}
		>
			<section
				ref={cardRef}
				className="profile-card"
			>
				<div className="profile-card__inside">
					<div className="profile-card__shine" />
					<div className="profile-card__glare" />

					<div className="pc-content pc-avatar-content">
						<img
							className="avatar"
							src={avatarUrl}
							loading="lazy"
							onError={(e) => {
								const target = e.target
								target.style.display = "none"
							}}
						/>

						<div className="pc-content">
							<div className="profile-card__user-title">
								<h3>{title}</h3>
							</div>
						</div>
					</div>

					<div className="pc-user-info">
						<div className="pc-user-details">
							<div className="pc-mini-avatar">
								<img
									src={avatarUrl}
									loading="lazy"
									onError={(e) => {
										const target = e.target
										target.style.opacity = "0.5"
										target.src = avatarUrl
									}}
								/>
							</div>

							<div className="pc-user-text">
								<div className="profile-card__user-info__username">
									@{username}
								</div>
								<div className="profile-card__user-info__followers">
									{followersText}
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}

const ProfileCard = React.memo(ProfileCardComponent)

export default ProfileCard
