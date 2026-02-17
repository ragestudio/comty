import { Slider } from "antd"
import { Icons } from "@components/Icons"

import "./index.less"

const SoundpadLocalVolume = () => {
	return (
		<div className="soundpad-dialog__local-volume">
			<Icons.Volume2 />
			<Slider
				min={0}
				max={1}
				step={0.05}
				defaultValue={app.cores.settings.get(
					"mediartc:soundpad:volume",
				)}
				onChangeComplete={(value) => {
					app.cores.settings.set("mediartc:soundpad:volume", value)
				}}
			/>
		</div>
	)
}

export default SoundpadLocalVolume
