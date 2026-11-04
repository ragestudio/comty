import Icons from "@/components/Icons"
import SoundpadSettings from "./render"

export default {
	key: "soundpad",
	label: "Soundpad",
	icon: Icons.Drum,
	permission: "MANAGE_SOUNDPAD",
	render: SoundpadSettings,
}
