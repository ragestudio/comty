import React from "react"
import classNames from "classnames"
import { motion, AnimatePresence } from "motion/react"
import { Icons } from "@components/Icons"

import Image from "./components/Image"

import "./index.less"

const Lightbox = ({ media, index, onClose }) => {
	const [selectedKey, setSelectedKey] = React.useState(index ?? 0)
	const [focusMode, setFocusMode] = React.useState(false)
	const [visible, setVisible] = React.useState(true)

	const onKeyPress = React.useCallback((e) => {
		if (e.key === "Escape") {
			exit()
		}

		if (e.key === "ArrowLeft") {
			setSelectedKey((prev) => Math.max(0, prev - 1))
		}

		if (e.key === "ArrowRight") {
			setSelectedKey((prev) => Math.min(media.length - 1, prev + 1))
		}
	}, [])

	const exit = React.useCallback(() => {
		setVisible(false)

		setTimeout(() => {
			if (typeof onClose === "function") {
				onClose()
			}
		}, 300)
	}, [])

	const handleExitClick = React.useCallback((e) => {
		if (focusMode) {
			return null
		}

		if (!e.target.classList.contains("lightbox__content")) {
			return null
		}

		exit()
	}, [])

	React.useEffect(() => {
		document.addEventListener("keydown", onKeyPress)

		return () => {
			document.removeEventListener("keydown", onKeyPress)
		}
	}, [])

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{
						duration: 0.25,
						ease: [0, 0.71, 0.2, 1.01],
					}}
					className={classNames("lightbox", {
						["focus-mode"]: focusMode || media.length < 2,
					})}
				>
					<div className="lightbox__header">
						<h1>
							<Icons.X
								onClick={exit}
								style={{
									cursor: "pointer",
								}}
							/>
						</h1>
					</div>

					<div
						className="lightbox__content"
						onClick={handleExitClick}
					>
						<Image
							src={media[selectedKey]}
							onDragEnableChange={setFocusMode}
						/>
					</div>

					<div className="lightbox__previews">
						{media.map((src, index) => (
							<div
								className={classNames(
									"lightbox__previews__item",
									{
										active: index === selectedKey,
									},
								)}
								key={index}
								onClick={() => setSelectedKey(index)}
							>
								<img src={src} />
							</div>
						))}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

export default Lightbox
