import type { SerializedScreen } from "@/rtc/screens/screen"
import type { Client } from "@comty/shared/types/rtc/client"

export type GridItem =
	| { kind: "local" }
	| { kind: "screen"; screen: SerializedScreen }
	| { kind: "client"; client: Client }

export const GAP = 10
export const FOCUS_ASPECT = 9 / 16
export const FOCUS_MAX_RATIO = 0.6
export const FOCUS_BOTTOM_PADDING = 20
export const FOCUS_OTHER_SCALE = 0.8
