import type { SerializedRemoteMedia } from "@comty/spaces-sdk/rtc"
import type { Client } from "@comty/shared/types/rtc/client"

export type GridItem =
	| { kind: "local"; media: "screen" | "camera" }
	| { kind: "screen"; screen: SerializedRemoteMedia }
	| { kind: "camera"; camera: SerializedRemoteMedia }
	| { kind: "client"; client: Client }

export const GAP = 10
export const FOCUS_ASPECT = 9 / 16
export const FOCUS_MAX_RATIO = 0.6
export const FOCUS_BOTTOM_PADDING = 20
export const FOCUS_OTHER_SCALE = 0.8
