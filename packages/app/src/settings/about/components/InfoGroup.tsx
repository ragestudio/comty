import React from "react"

export interface InfoGroupProps {
	icon?: React.ReactNode
	title: string
	children: React.ReactNode
}

export function InfoGroup({ icon, title, children }: InfoGroupProps) {
	return (
		<div className="group bg-accent">
			<div className="group_header">
				<h3>
					{icon}
					{title}
				</h3>
			</div>

			{children}
		</div>
	)
}

export default InfoGroup
