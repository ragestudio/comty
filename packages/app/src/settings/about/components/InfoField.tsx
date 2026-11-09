import React from "react"

export interface InfoFieldProps {
	icon?: React.ReactNode
	label: string
	headerExtra?: React.ReactNode
	value?: React.ReactNode
	children?: React.ReactNode
}

export function InfoField({
	icon,
	label,
	headerExtra,
	value,
	children,
}: InfoFieldProps) {
	return (
		<div className="inline_field">
			<div className="field_header">
				{icon && <div className="field_icon">{icon}</div>}

				<p>{label}</p>

				{headerExtra}
			</div>

			<div className="field_value">{children ?? value ?? "Unknown"}</div>
		</div>
	)
}

export default InfoField
