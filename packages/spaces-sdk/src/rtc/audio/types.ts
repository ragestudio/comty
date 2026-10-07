export type AudioDeviceKind = "input" | "output"

export interface AudioDevice {
	id: string
	kind: AudioDeviceKind
	type: string
	label: string
	isCurrent: boolean
}

// a strategy knows how to enumerate and route audio for one runtime, the sdk
// picks the first supported one, some capabilities are optional
export interface AudioStrategy {
	name: string
	speakerAvailable: boolean
	supports(): boolean
	getDevices(): Promise<AudioDevice[]>
	setSpeakerEnabled?(enabled: boolean): Promise<void>
	isSpeakerEnabled?(): Promise<boolean>
	setOutputDevice?(deviceId: string): Promise<boolean>
}
