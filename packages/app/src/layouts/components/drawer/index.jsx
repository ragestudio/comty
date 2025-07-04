import React, {
	useState,
	useEffect,
	useCallback,
	useMemo,
	useRef,
	createContext,
	useContext,
} from "react"
import classnames from "classnames"
import { AnimatePresence, motion } from "motion/react"

import Drawer from "./component"

import "./index.less"

// Context for drawer management
const DrawerContext = createContext()

// Hook to use drawer context
export const useDrawer = () => {
	const context = useContext(DrawerContext)

	if (!context) {
		throw new Error("useDrawer must be used within a DrawerProvider")
	}

	return context
}

function DrawerController() {
	const [state, setState] = useState({
		addresses: {},
		refs: {},
		drawers: [],
		maskVisible: false,
	})

	const stateRef = useRef(state)
	stateRef.current = state

	const toggleMaskVisibility = useCallback((to) => {
		setState((prev) => ({
			...prev,
			maskVisible: to ?? !prev.maskVisible,
		}))
	}, [])

	const handleEscKeyPress = useCallback((event) => {
		const currentState = stateRef.current

		if (currentState.drawers.length === 0) {
			return null
		}

		let isEscape = false

		if ("key" in event) {
			isEscape = event.key === "Escape" || event.key === "Esc"
		} else {
			isEscape = event.keyCode === 27
		}

		if (isEscape) {
			closeLastDrawer()
		}
	}, [])

	const getLastDrawer = useCallback(() => {
		const currentState = stateRef.current
		const lastDrawerId =
			currentState.drawers[currentState.drawers.length - 1]?.id

		if (!lastDrawerId) {
			return null
		}

		return {
			id: lastDrawerId,
			ref: currentState.refs[lastDrawerId]?.current,
			options:
				currentState.drawers[currentState.drawers.length - 1]?.options,
		}
	}, [])

	const closeLastDrawer = useCallback(() => {
		const lastDrawer = getLastDrawer()

		if (lastDrawer && lastDrawer.id) {
			if (
				app.layout?.modal &&
				lastDrawer.options?.confirmOnOutsideClick
			) {
				return app.layout.modal.confirm({
					descriptionText:
						lastDrawer.options.confirmOnOutsideClickText ||
						"Are you sure you want to close this drawer?",
					onConfirm: () => {
						close(lastDrawer.id)
					},
				})
			}

			close(lastDrawer.id)
		}
	}, [getLastDrawer])

	const close = useCallback(
		async (id, { transition = 0 } = {}) => {
			const currentState = stateRef.current
			const index = currentState.addresses[id]
			const ref = currentState.refs[id]?.current

			if (typeof ref === "undefined") {
				console.warn("This drawer does not exist")
				return
			}

			if (currentState.drawers.length === 1) {
				toggleMaskVisibility(false)
			}

			if (transition > 0) {
				await new Promise((resolve) => {
					setTimeout(resolve, transition)
				})
			}

			setState((prev) => {
				const newDrawers = prev.drawers.filter((_, i) => i !== index)
				const newAddresses = { ...prev.addresses }
				const newRefs = { ...prev.refs }

				delete newAddresses[id]
				delete newRefs[id]

				return {
					...prev,
					refs: newRefs,
					addresses: newAddresses,
					drawers: newDrawers,
				}
			})
		},
		[toggleMaskVisibility],
	)

	const closeAll = useCallback(() => {
		const currentState = stateRef.current
		currentState.drawers.forEach((drawer) => {
			close(drawer.id)
		})
	}, [close])

	// Create controller object
	const controller = useMemo(
		() => ({
			close,
			closeAll,
			drawers: () => stateRef.current.drawers,
			drawersLength: () => stateRef.current.drawers.length,
			isMaskVisible: () => stateRef.current.maskVisible,
		}),
		[close, closeAll],
	)

	const open = useCallback(
		(id, component, options = {}) => {
			setState((prev) => {
				const { refs, drawers, addresses } = prev

				const newRefs = { ...refs }
				const newDrawers = [...drawers]
				const newAddresses = { ...addresses }

				const drawerRef = React.createRef()
				const instance = {
					id,
					children: component,
					options,
					controller,
				}

				if (typeof newAddresses[id] === "undefined") {
					newDrawers.push({
						...instance,
						element: (
							<Drawer key={id} ref={drawerRef} {...instance} />
						),
					})
					newAddresses[id] = newDrawers.length - 1
					newRefs[id] = drawerRef
				} else {
					newDrawers[newAddresses[id]] = {
						...instance,
						element: (
							<Drawer key={id} ref={drawerRef} {...instance} />
						),
					}
					newRefs[id] = drawerRef
				}

				return {
					...prev,
					refs: newRefs,
					addresses: newAddresses,
					drawers: newDrawers,
					maskVisible: true,
				}
			})
		},
		[controller],
	)

	// Complete interface with open method
	const interface_ = useMemo(
		() => ({
			...controller,
			open,
		}),
		[controller, open],
	)

	// Setup effects
	useEffect(() => {
		if (app.layout) {
			app.layout["drawer"] = interface_
		}

		return () => {
			if (app.layout) {
				delete app.layout["drawer"]
			}
		}
	}, [interface_])

	useEffect(() => {
		document.addEventListener("keydown", handleEscKeyPress)

		return () => {
			document.removeEventListener("keydown", handleEscKeyPress)
		}
	}, [handleEscKeyPress])

	// Handle sidebar visibility based on mask visibility
	useEffect(() => {
		if (app.layout?.sidebar) {
			app.layout.sidebar.toggleVisibility(!state.maskVisible)
		}
	}, [state.maskVisible])

	return (
		<DrawerContext.Provider value={interface_}>
			<AnimatePresence>
				{state.maskVisible && (
					<motion.div
						className="drawers-mask"
						onClick={closeLastDrawer}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{
							type: "spring",
							stiffness: 100,
							damping: 20,
						}}
					/>
				)}
			</AnimatePresence>

			<div
				className={classnames("drawers-wrapper", {
					["hidden"]: !state.drawers.length,
				})}
			>
				<AnimatePresence mode="wait">
					{state.drawers.map((drawer) => drawer.element)}
				</AnimatePresence>
			</div>
		</DrawerContext.Provider>
	)
}

export default DrawerController
