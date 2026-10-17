import React from "react"
import Modal from "./modal"
import { Button } from "antd"

import useLayoutInterface from "@hooks/useLayoutInterface"

function ConfirmModal(props) {
	const [loading, setLoading] = React.useState(false)

	/**
	 * @param {object} [options]
	 * @param {boolean} [options.confirm]
	 */
	async function close({ confirm } = {}) {
		props.close()

		if (typeof props.onClose === "function") {
			props.onClose()
		}

		if (confirm === true) {
			if (typeof props.onConfirm === "function") {
				if (props.onConfirm.constructor.name === "AsyncFunction") {
					setLoading(true)
				}

				await props.onConfirm()

				setLoading(false)
			}
		} else {
			if (typeof props.onCancel === "function") {
				props.onCancel()
			}
		}
	}

	return (
		<div className="app-modal_confirm">
			<div className="app-modal_confirm_content">
				<h1>{props.headerText ?? "Are you sure?"}</h1>

				{props.descriptionText && <p>{props.descriptionText}</p>}
			</div>

			{typeof props.render === "function" && props.render()}

			<div className="app-modal_confirm_actions">
				<Button
					onClick={() => close({ confirm: false })}
					disabled={loading}
				>
					Cancel
				</Button>
				<Button
					onClick={() => close({ confirm: true })}
					disabled={loading}
					loading={loading}
				>
					Yes
				</Button>
			</div>
		</div>
	)
}

export default () => {
	function confirm(options = {}) {
		open("confirm", ConfirmModal, {
			props: {
				onConfirm: options.onConfirm,
				onCancel: options.onCancel,
				onClose: options.onClose,

				render: options.render,

				headerText: options.headerText,
				descriptionText: options.descriptionText,
			},
		})
	}

	/**
	 * @param {string} id
	 * @param {any} render
	 * @param {object} [options]
	 * @param {boolean} [options.framed]
	 * @param {boolean} [options.confirmOnOutsideClick]
	 * @param {any} [options.confirmOnClickTitle]
	 * @param {any} [options.confirmOnClickContent]
	 * @param {any} [options.onClose]
	 * @param {string} [options.className]
	 * @param {any} [options.props]
	 */
	function open(
		id,
		render,
		{
			framed = true,

			confirmOnOutsideClick = false,
			confirmOnClickTitle,
			confirmOnClickContent,

			onClose = null,

			className,
			props,
		} = {},
	) {
		app.cores.window_mng.render(
			id,
			<Modal
				className={className}
				framed={framed}
				confirmOnOutsideClick={confirmOnOutsideClick}
				confirmOnClickTitle={confirmOnClickTitle}
				confirmOnClickContent={confirmOnClickContent}
				onClose={() => {
					app.cores.window_mng.close(id)
				}}
			>
				{React.isValidElement(render)
					? React.cloneElement(render, props)
					: React.createElement(render, props)}
			</Modal>,
			{
				useFrame: false,
				closeOnClickOutside: false,
				onClose: onClose,
			},
		)
	}

	function close(id) {
		app.cores.window_mng.close(id)
	}

	useLayoutInterface("modal", {
		open: open,
		close: close,
		confirm: confirm,
	})

	return null
}
