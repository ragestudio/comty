import type { GroupRole } from "@comty/shared/types/spaces/role"

import React from "react"

import Button from "@ui/Button"
import { Icons } from "@components/Icons"

export type RolesListProps = {
	roles: GroupRole[]
	selectedKey: string | null
	onSelect: (roleKey: string) => void
	onCreate: () => void
	onMove: (roleKey: string, direction: number) => void
}

const RolesList = ({
	roles,
	selectedKey,
	onSelect,
	onCreate,
	onMove,
}: RolesListProps) => {
	return (
		<div className="permissions-settings__roles">
			{roles.map((role) => (
				<div
					key={role.role_key}
					onClick={() => onSelect(role.role_key)}
					className={[
						"permissions-settings__role",
						role.role_key === selectedKey ? "selected" : null,
					]
						.filter(Boolean)
						.join(" ")}
				>
					<button className="permissions-settings__role__select">
						<span
							className="permissions-settings__role__color"
							style={{ background: role.color ?? "#808080" }}
						/>
						<span>{role.label}</span>
						{role.is_default && <Icons.Lock />}
					</button>

					{!role.is_default && (
						<span className="permissions-settings__role__actions">
							<button onClick={() => onMove(role.role_key, -1)}>
								<Icons.ChevronUp />
							</button>
							<button onClick={() => onMove(role.role_key, 1)}>
								<Icons.ChevronDown />
							</button>
						</span>
					)}
				</div>
			))}

			<Button
				icon={<Icons.Plus />}
				onClick={onCreate}
			>
				Create role
			</Button>
		</div>
	)
}

export default RolesList
