export default async (main) => {
	// start pipewire
	const pw_module = await import("../../classes/Pipewire.js")
	main.modules.set("pipewire", new pw_module.default(main))

	// start pulseaudio
	const pa_module = await import("../../classes/PulseAudio.js")
	main.modules.set("pulseaudio", new pa_module.default(main))

	await main.modules.get("pulseaudio").initialize()
}
