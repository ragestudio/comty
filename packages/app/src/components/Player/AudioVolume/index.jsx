import Slider from "@ui/Slider"

import "./index.less"

const AudioVolume = (props) => {
	const lastUpdateTime = React.useRef(null)

	return (
		<div className="player-volume_slider">
			<Slider
				min={0}
				max={1}
				step={0.01}
				value={props.volume}
				onChangeComplete={(value) => {
					props.onChange(value)
				}}
				onChange={(value) => {
					if (
						lastUpdateTime.current &&
						performance.now() - lastUpdateTime.current < 150
					) {
						return
					}
					props.onChange(value)
					lastUpdateTime.current = performance.now()
				}}
				defaultValue={props.defaultValue}
				valueFormat={(value) => {
					return `${Math.round(value * 100)}%`
				}}
			/>
		</div>
	)
}

export default AudioVolume
