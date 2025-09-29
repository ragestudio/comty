import Core from "vessel/core"
import { Howl } from "howler"
import axios from "axios"

import config from "@config"

export default class SFXCore extends Core {
	static namespace = "sfx"
	static dependencies = ["settings"]

	soundsPool = {}

	public = {
		loadSoundpack: this.loadSoundpack.bind(this),
		play: this.play,
		soundsPool: () => this.soundsPool,
	}

	onEvents = {
		"sfx:test": (volume) => {
			// play a sound to test volume
			this.play("test", {
				volume: volume / 100,
			})
		},
	}

	async afterInitialize() {
		await this.loadSoundpack()

		document.addEventListener(
			"click",
			(...args) => {
				this.handleClick(...args)
			},
			true,
		)
	}

	async loadSoundpack(soundpack) {
		if (typeof soundpack === "undefined") {
			soundpack =
				window.app.cores.settings.get("soundpack") ??
				config.defaultSoundPack ??
				{}
		}

		// check if is valid url with regex
		const urlRegex = /^(http|https):\/\/[^ "]+$/

		if (urlRegex.test(soundpack)) {
			const { data } = await axios.get(soundpack)

			soundpack = data
		}

		if (typeof soundpack.sounds !== "object") {
			this.console.error(
				`Soundpack [${soundpack.id}] is not a valid soundpack.`,
			)
			return false
		}

		this.console.log(
			`Loading soundpack [${soundpack.id} | ${soundpack.name}] by ${soundpack.author} (${soundpack.version})`,
		)

		for (const [name, path] of Object.entries(soundpack.sounds)) {
			this.soundsPool[name] = new Howl({
				volume: 0.5,
				src: [path],
			})
		}
	}

	async play(name, options = {}) {
		if (window.app.cores.settings.is("ui.effects", false)) {
			return false
		}

		const audioInstance = this.soundsPool[name]

		if (!audioInstance) {
			console.warn(`Sound [${name}] not found in soundpack`)
			return false
		}

		if (typeof options.volume !== "undefined") {
			audioInstance.volume(options.volume)
		} else {
			audioInstance.volume(
				(window.app.cores.settings.get("ui.general_volume") ?? 0) / 100,
			)
		}

		audioInstance.play()
	}

	async handleClick(event) {
		// search for closest button
		const button =
			event.target.closest("button") || event.target.closest(".ant-btn")

		// search for a slider
		const slider = event.target.closest("input[type=range]")

		// if button exist and has aria-checked attribute then play switch_on or switch_off
		if (button) {
			if (button.hasAttribute("aria-checked")) {
				return this.play(
					button.getAttribute("aria-checked") === "true"
						? "component.switch_off"
						: "component.switch_on",
				)
			}

			return this.play("generic_click")
		}

		if (slider) {
			// check if is up or down
		}
	}
}
