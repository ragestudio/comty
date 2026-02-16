import React from "react"
import { motion, AnimatePresence } from "motion/react"
import Button from "./Button"

import { Icons } from "@components/Icons"

import "./ConfirmButton.less"

const ConfirmButton = ({ children, icon, onConfirm, onCancel }) => {
	const [open, setOpen] = React.useState(false)
	const [loading, setLoading] = React.useState(false)

	const onClickConfirm = () => {
		setOpen(false)
		handleConfirm()
	}

	const onClickCancel = () => {
		setOpen(false)
		handleCancel()
	}

	const handleConfirm = async () => {
		if (typeof onConfirm === "function") {
			setLoading(true)
			try {
				await onConfirm()
			} catch (err) {
				console.error(err)
			}
			setLoading(false)
		}
	}

	const handleCancel = () => {
		if (typeof onCancel === "function") {
			onCancel()
		}
	}

	if (loading) {
		return (
			<Button disabled>
				<Icons.LoadingOutlined />
			</Button>
		)
	}

	if (open) {
		return (
			<Button className="confirm-button">
				<div onClick={onClickConfirm}>
					<Icons.Check />
				</div>
				<div className="confirm-button__divider" />
				<div onClick={onClickCancel}>
					<Icons.X />
				</div>
			</Button>
		)
	}

	return (
		<Button
			icon={icon}
			onClick={(e) => {
				e.stopPropagation()

				if (e.shiftKey === true) {
					return handleConfirm()
				}

				return setOpen(true)
			}}
			children={children}
		/>
	)
}

const ConfirmButtonWrapper = (props) => {
	return (
		<AnimatePresence mode="wait">
			<ConfirmButton {...props} />
		</AnimatePresence>
	)
}

export default ConfirmButtonWrapper
