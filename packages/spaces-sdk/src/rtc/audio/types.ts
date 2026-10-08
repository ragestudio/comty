export type AudioDeviceKind = "input" | "output"

// call uses the system voice path (bluetooth headset mic and output), while
// high-fidelity keeps bluetooth output on a2dp stereo and captures only from
// the device builtin mic
export type AudioRouteMode = "call" | "high-fidelity"

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
	setInputDevice?(deviceId: string): Promise<boolean>
	setRouteMode?(mode: AudioRouteMode): Promise<boolean>
	isBluetoothAvailable?(): Promise<boolean>
	resetRouting?(): Promise<boolean>
}
