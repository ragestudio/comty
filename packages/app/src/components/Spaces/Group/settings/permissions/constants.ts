import type { GroupPermission } from "@comty/shared/types/spaces/permissions"

export type PermissionGroup = {
	label: string
	keys: GroupPermission[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
	{
		label: "General",
		keys: ["ADMINISTRATOR", "UPDATE_GROUP", "MANAGE_ROLES"],
	},
	{
		label: "Members",
		keys: [
			"READ_MEMBERSHIPS",
			"MANAGE_MEMBERSHIPS",
			"KICK_MEMBERS",
			"BAN_MEMBERS",
			"MANAGE_INVITES",
		],
	},
	{
		label: "Channels",
		keys: [
			"READ_CHANNELS",
			"WRITE_CHANNELS",
			"MANAGE_CHANNELS",
			"MANAGE_CLIENTS",
		],
	},
	{
		label: "Voice",
		keys: [
			"VOICE_CONNECT",
			"VOICE_SPEAK",
			"VOICE_STREAM",
			"VOICE_MOVE_MEMBERS",
			"VOICE_KICK_MEMBERS",
		],
	},
	{
		label: "Messages",
		keys: ["MANAGE_MESSAGES"],
	},
	{
		label: "Soundpad",
		keys: ["MANAGE_SOUNDPAD"],
	},
]
