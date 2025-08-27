export default async (main) => {
	// start pipewire
	await main.loadModule("pipewire", "./modules/pipewire/index.js")

	// start pulseaudio
	await main.loadModule("pulseaudio", "./modules/pulseaudio/index.js")
}
