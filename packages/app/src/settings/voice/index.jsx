import DevicesSetting from "./devices"
import NoiseSuppresionSetting from "./noise-suppresion"
import VolumeGateSetting, { GateEnabledSetting } from "./volume-gate"
import { EchoCancelation, AutoGain } from "./enchacements"

export default {
	id: "voice",
	icon: "Podcast",
	label: "Voice",
	group: "app",
	settings: [
		DevicesSetting,
		GateEnabledSetting,
		VolumeGateSetting,
		NoiseSuppresionSetting,
		EchoCancelation,
		AutoGain,
	],
}
