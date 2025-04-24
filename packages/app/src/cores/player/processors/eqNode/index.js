import ProcessorNode from "../node"
import Presets from "../../classes/Presets"

export default class EqProcessorNode extends ProcessorNode {
	constructor(props) {
		super(props)

		this.presets = new Presets({
			storage_key: "eq",
			defaultPresetValue: {
				32: 0,
				64: 0,
				125: 0,
				250: 0,
				500: 0,
				1000: 0,
				2000: 0,
				4000: 0,
				8000: 0,
				16000: 0,
			},
			onApplyValues: this.applyValues.bind(this),
		})

		this.exposeToPublic = {
			presets: this.presets,
		}
	}

	static refName = "eq"

	applyValues() {
		// apply to current instance
		this.processor.eqNodes.forEach((processor) => {
			const gainValue =
				this.presets.currentPresetValues[processor.frequency.value]

			if (processor.gain.value !== gainValue) {
				console.debug(
					`[EQ] Applying values to ${processor.frequency.value} Hz frequency with gain ${gainValue}`,
				)
				processor.gain.value = gainValue
			}
		})
	}

	async init() {
		if (!this.audioContext) {
			throw new Error("audioContext is required")
		}

		this.processor = this.audioContext.createGain()

		this.processor.gain.value = 1

		this.processor.eqNodes = []

		const values = Object.entries(this.presets.currentPresetValues).map(
			(entry) => {
				return {
					freq: parseFloat(entry[0]),
					gain: parseFloat(entry[1]),
				}
			},
		)

		values.forEach((eqValue, index) => {
			// chekc if freq and gain is valid
			if (isNaN(eqValue.freq)) {
				eqValue.freq = 0
			}
			if (isNaN(eqValue.gain)) {
				eqValue.gain = 0
			}

			this.processor.eqNodes[index] =
				this.audioContext.createBiquadFilter()
			this.processor.eqNodes[index].type = "peaking"
			this.processor.eqNodes[index].frequency.value = eqValue.freq
			this.processor.eqNodes[index].gain.value = eqValue.gain
		})

		// connect nodes
		for await (let [index, eqNode] of this.processor.eqNodes.entries()) {
			const nextNode = this.processor.eqNodes[index + 1]

			if (index === 0) {
				this.processor.connect(eqNode)
			}

			if (nextNode) {
				eqNode.connect(nextNode)
			}
		}

		// set last processor for processor node can properly connect to the next node
		this.processor._last = this.processor.eqNodes.at(-1)
	}
}
