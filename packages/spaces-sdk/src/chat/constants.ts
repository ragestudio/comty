import type { ChatConfig } from "./types"

import GROUP_CONFIG from "./configs/group"
import DM_CONFIG from "./configs/dm"

export const CHAT_CONFIGS: Record<string, ChatConfig> = {
	group: GROUP_CONFIG,
	dm: DM_CONFIG,
}
