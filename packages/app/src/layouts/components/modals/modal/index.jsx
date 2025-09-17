import React from "react"
import { Modal as AntdModal } from "antd"
import classnames from "classnames"

import { Icons } from "@components/Icons"

import "./index.less"

class Modal extends React.Component {
	state = {
		visible: false,
	}

	contentRef = React.createRef()

	escTimeout = null

	componentDidMount() {
		setTimeout(() => {
			this.setState({
				visible: true,
			})
		}, 10)

		document.addEventListener("keydown", this.handleEsc, false)
	}

	componentWillUnmount() {
		document.removeEventListener("keydown", this.handleEsc, false)
	}

	close = () => {
		this.setState({
			visible: false,
		})

		setTimeout(() => {
			if (typeof this.props.onClose === "function") {
				this.props.onClose()
			}
		}, 250)
	}

	handleEsc = (e) => {
		if (e.key === "Escape") {
			if (this.escTimeout !== null) {
				clearTimeout(this.escTimeout)
				return this.close()
			}

			this.escTimeout = setTimeout(() => {
				this.escTimeout = null
			}, 250)
		}
	}

	handleClickOutside = (e) => {
		// check if event click is outside of content of the modal
		if (this.contentRef.current.contains(e.target)) {
			return false
		}

		if (this.props.confirmOnOutsideClick) {
			return AntdModal.confirm({
				title: this.props.confirmOnClickTitle ?? "Are you sure?",
				content:
					this.props.confirmOnClickContent ??
					"Are you sure you want to close this window?",
				onOk: () => {
					this.close()
				},
			})
		}

		return this.close()
	}

	render() {
		return (
			<div
				className={classnames("app_modal_wrapper", {
					["active"]: this.state.visible,
					["framed"]: this.props.framed,
				})}
			>
				<div
					id="mask_trigger"
					onTouchEnd={this.handleClickOutside}
					onMouseDown={this.handleClickOutside}
				/>
				<div
					className="app_modal_content"
					ref={this.contentRef}
					style={this.props.frameContentStyle}
				>
					{this.props.includeCloseButton && (
						<div
							className="app_modal_close"
							onClick={this.close}
						>
							<Icons.X />
						</div>
					)}

					{React.cloneElement(this.props.children, {
						close: this.close,
					})}
				</div>
			</div>
		)
	}
}

export default Modal
