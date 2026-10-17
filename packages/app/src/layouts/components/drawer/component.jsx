import React, {
	useState,
	useEffect,
	useCallback,
	useMemo,
	forwardRef,
	useImperativeHandle,
} from "react"
import PropTypes from "prop-types"
import classnames from "classnames"
import { motion } from "motion/react"

import DrawerHeader from "./header"

/**
 * @typedef {object} DrawerProps
 * @property {string} id
 * @property {any} children
 * @property {any} [options]
 * @property {any} controller
 */

/** @type {React.ForwardRefRenderFunction<any, DrawerProps>} */
const DrawerRender = ({ id, children, options = {}, controller }, ref) => {
	const [header, setHeader] = useState(options.header)

	const {
		position = "left",
		style = {},
		props: componentProps = {},
		onDone,
		onFail,
	} = options

	const setExtraActions = useCallback((actions) => {
		setHeader((prev) => ({ ...prev, actions: actions }))
	}, [])

	const setDrawerHeader = useCallback((header) => {
		setHeader(header)
	}, [])

	const handleClose = useCallback(async () => {
		if (typeof options.onClose === "function") {
			options.onClose()
		}

		setTimeout(() => {
			controller.close(id, { transition: 150 })
		}, 150)
	}, [id, controller, options.onClose])

	const handleDone = useCallback(
		(...context) => {
			if (typeof onDone === "function") {
				onDone(context)
			}
		},
		[onDone],
	)

	const handleFail = useCallback(
		(...context) => {
			if (typeof onFail === "function") {
				onFail(context)
			}
		},
		[onFail],
	)

	const animationVariants = useMemo(() => {
		const slideDirection = position === "right" ? 100 : -100

		return {
			initial: {
				x: slideDirection,
				opacity: 0,
			},
			animate: {
				x: 0,
				opacity: 1,
			},
			exit: {
				x: slideDirection,
				opacity: 0,
			},
		}
	}, [position])

	const enhancedComponentProps = useMemo(
		() => ({
			...componentProps,
			setHeader,
			close: handleClose,
			handleDone,
			handleFail,
		}),
		[componentProps, handleClose, handleDone, handleFail],
	)

	useImperativeHandle(
		ref,
		() => ({
			close: handleClose,
			handleDone,
			handleFail,
			options,
			id,
		}),
		[handleClose, handleDone, handleFail, options, id],
	)

	useEffect(() => {
		if (!controller) {
			throw new Error(`Cannot mount a drawer without a controller`)
		}

		if (!children) {
			throw new Error(`Empty component`)
		}
	}, [controller, children])

	return (
		<motion.div
			ref={ref}
			key={id}
			id={id}
			className={classnames("drawer", `drawer-${position}`)}
			style={style}
			{...animationVariants}
			transition={{
				type: "spring",
				stiffness: 100,
				damping: 20,
			}}
		>
			{header && (
				<DrawerHeader
					{...header}
					onClose={handleClose}
				/>
			)}

			<div className="drawer-content">
				{React.createElement(children, enhancedComponentProps)}
			</div>
		</motion.div>
	)
}

const Drawer = React.memo(React.forwardRef(DrawerRender))

Drawer.displayName = "Drawer"

export default Drawer
