import ProcessorNode from "../node"
import Presets from "../../classes/Presets"

export default class CompressorProcessorNode extends ProcessorNode {
	constructor(props) {
		super(props)

		this.presets = new Presets({
			storage_key: "compressor",
			defaultPresetValue: {
				threshold: -50,
				knee: 40,
				ratio: 12,
				attack: 0.003,
				release: 0.25,
			},
			onApplyValues: this.applyValues.bind(this),
		})

		this.exposeToPublic = {
			presets: this.presets,
			detach: this._detach,
			attach: this._attach,
		}
	}

	static refName = "compressor"
	static dependsOnSettings = ["player.compressor"]

	async init() {
		this.processor = this.audioContext.createDynamicsCompressor()

		this.applyValues()
	}

	applyValues() {
		Object.keys(this.presets.currentPresetValues).forEach((key) => {
			this.processor[key].value = this.presets.currentPresetValues[key]
		})
	}
}
