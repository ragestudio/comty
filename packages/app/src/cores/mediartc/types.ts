import type MediaRTC from "./mediartc.core"
import * as Vars from "./vars"

export interface MediaRTCHandlers {
	attachChannel: (data: any) => Promise<void>
	joinChannel: (groupId: string, channelId: string) => Promise<void>
	leaveChannel: () => Promise<void>
	startCameraShare: () => Promise<void>
	stopCameraShare: () => Promise<void>
	startScreenShare: () => Promise<void>
	stopScreenShare: () => Promise<void>
	createTransports: () => Promise<void>
	changeInputParams: (params: any) => Promise<void>
	changeOutputParams: (params: any) => Promise<void>
	changeScreenParams: (params: any) => Promise<void>
	soundpadDispatch: (soundId: string) => Promise<void>
	toggleMute: (to?: boolean) => Promise<boolean | void>
	toggleDeafen: (to?: boolean) => Promise<boolean | void>
	callUser: (userId: string) => Promise<void>
}

export interface MediaRTCPublic {
	instance: () => MediaRTC
	handlers: () => MediaRTCHandlers
	state: () => any
	vars: () => typeof Vars
	socket: () => any
	openDebugWindow: () => Promise<void>
	closeDebugWindow: () => Promise<void>
}

export interface WebsocketEvent {
	[event: string]: (core: MediaRTC, data: any) => Promise<void>
}
