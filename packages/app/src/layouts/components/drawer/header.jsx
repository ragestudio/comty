import React from "react"
import PropTypes from "prop-types"

const DrawerHeader = ({ title, actions, onClose, showCloseButton = true }) => {
	if (!title && !actions && !showCloseButton) return null

	return (
		<div className="drawer-header">
			<div className="drawer-header-content">
				{title && <h3 className="drawer-title">{title}</h3>}
				<div className="drawer-header-actions">
					{actions && (
						<div className="drawer-custom-actions">{actions}</div>
					)}
					{showCloseButton && (
						<button
							className="drawer-close-button"
							onClick={onClose}
							aria-label="Close drawer"
						>
							×
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

DrawerHeader.propTypes = {
	title: PropTypes.string,
	actions: PropTypes.node,
	onClose: PropTypes.func.isRequired,
	showCloseButton: PropTypes.bool,
}

export default DrawerHeader
