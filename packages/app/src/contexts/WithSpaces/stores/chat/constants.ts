import GROUP_CONFIG from "./configs/group"
import DM_CONFIG from "./configs/dm"

export const CHAT_CONFIGS: Record<string, any> = {
	group: GROUP_CONFIG,
	dm: DM_CONFIG,
}

export const getSocket = () =>
	globalThis.__comty_shared_state?.ws?.sockets?.get("main") ??
	window.app?.cores?.api?.socket?.() ??
	null
