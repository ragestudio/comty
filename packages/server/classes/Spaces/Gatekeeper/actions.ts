import type { GroupPermission } from "@comty/shared/types/spaces/permissions"

export const GROUP_ACTIONS = {
	"group.update": "UPDATE_GROUP",
	"group.member.kick": "KICK_MEMBERS",
	"group.member.ban": "BAN_MEMBERS",
	"group.member.manage_roles": "MANAGE_ROLES",
	"group.channel.manage": "MANAGE_CHANNELS",
	"group.invite.manage": "MANAGE_INVITES",
	"group.role.manage": "MANAGE_ROLES",
	"group.soundpad.manage": "MANAGE_SOUNDPAD",
	"group.client.manage": "MANAGE_CLIENTS",
} as const satisfies Record<string, GroupPermission>

export type GroupAction = keyof typeof GROUP_ACTIONS
