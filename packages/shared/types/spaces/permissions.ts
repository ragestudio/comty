export const GROUP_PERMISSIONS = {
	ADMINISTRATOR: {
		key: "administrator",
	},
	READ_CHANNELS: {
		key: "read_channels",
	},
	WRITE_CHANNELS: {
		key: "write_channels",
	},
	MANAGE_CHANNELS: {
		key: "manage_channels",
	},
	MANAGE_CLIENTS: {
		key: "manage_clients",
	},
	UPDATE_GROUP: {
		key: "update_group",
	},
	MANAGE_ROLES: {
		key: "manage_roles",
	},
	MANAGE_MEMBERSHIPS: {
		key: "manage_memberships",
	},
	KICK_MEMBERS: {
		key: "kick_members",
	},
	BAN_MEMBERS: {
		key: "ban_members",
	},
	READ_MEMBERSHIPS: {
		key: "read_memberships",
	},
	MANAGE_INVITES: {
		key: "manage_invites",
	},
	MANAGE_SOUNDPAD: {
		key: "manage_soundpad",
	},
	MANAGE_MESSAGES: {
		key: "manage_messages",
	},
	VOICE_CONNECT: {
		key: "voice_connect",
	},
	VOICE_SPEAK: {
		key: "voice_speak",
	},
	VOICE_STREAM: {
		key: "voice_stream",
	},
	VOICE_MOVE_MEMBERS: {
		key: "voice_move_members",
	},
	VOICE_KICK_MEMBERS: {
		key: "voice_kick_members",
	},
} as const

export type GroupPermission = keyof typeof GROUP_PERMISSIONS

export type GroupPermissionMap = Partial<Record<GroupPermission, boolean>>

export const GROUP_PERMISSION_KEYS = Object.keys(
	GROUP_PERMISSIONS,
) as GroupPermission[]

export const GROUP_PERMISSION_LABELS: Record<GroupPermission, string> = {
	ADMINISTRATOR: "Administrator",
	READ_CHANNELS: "Read channels",
	WRITE_CHANNELS: "Write in channels",
	MANAGE_CHANNELS: "Manage channels",
	MANAGE_CLIENTS: "Manage voice clients",
	UPDATE_GROUP: "Update group",
	MANAGE_ROLES: "Manage roles",
	MANAGE_MEMBERSHIPS: "Manage memberships",
	KICK_MEMBERS: "Kick members",
	BAN_MEMBERS: "Ban members",
	READ_MEMBERSHIPS: "Read memberships",
	MANAGE_INVITES: "Manage invites",
	MANAGE_SOUNDPAD: "Manage soundpad",
	MANAGE_MESSAGES: "Manage messages",
	VOICE_CONNECT: "Connect to voice channels",
	VOICE_SPEAK: "Speak in voice channels",
	VOICE_STREAM: "Share screen or camera",
	VOICE_MOVE_MEMBERS: "Move members between voice channels",
	VOICE_KICK_MEMBERS: "Disconnect members from voice channels",
}
