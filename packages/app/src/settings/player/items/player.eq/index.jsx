import SlidersWithPresets from "../../../components/slidersWithPresets"

export default (props) => {
	return (
		<SlidersWithPresets
			{...props}
			controller={app.cores.player.base().processors.eq.presets}
		/>
	)
}
