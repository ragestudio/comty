import { Slider } from "antd"
import { Icons } from "@components/Icons"

import {
	getSoundpadVolume,
	setSoundpadVolume,
} from "@comty/spaces-sdk/rtc/audio/soundpad"

import "./index.less"

const SoundpadLocalVolume = () => {
	return (
		<div className="soundpad-dialog__local-volume">
			<Icons.Volume2 />
			<Slider
				min={0}
				max={1}
				step={0.05}
				defaultValue={getSoundpadVolume()}
				onChangeComplete={(value) => {
					setSoundpadVolume(value)
				}}
			/>
		</div>
	)
}

export default SoundpadLocalVolume
