export default {
	"window:minimize": (ctx) => {
		ctx.mainWindow.minimize()
	},
	"window:maximize": (ctx) => {
		ctx.mainWindow.maximize()
	},
	"window:close": (ctx) => {
		ctx.mainWindow.hide()
	},
	"app:restart": (ctx) => {
		ctx.restart()
	},
	"desktopcapturer:initialize": async (ctx) => {
		const desktopCapturerModule = ctx.modules.get("desktopCapturer")

		if (!desktopCapturerModule) {
			throw new Error("DesktopCapturer module is not available")
		}

		return await desktopCapturerModule.initialize()
	},
	"pulseaudio:getSources": async (ctx) => {
		const pulseaudioModule = ctx.modules.get("pulseaudio")

		if (!pulseaudioModule) {
			throw new Error("Pulseaudio module is not available")
		}

		return await pulseaudioModule.getSources()
	},

	"pulseaudio:getSourceOutputs": async (ctx) => {
		const pulseaudioModule = ctx.modules.get("pulseaudio")

		if (!pulseaudioModule) {
			throw new Error("Pulseaudio module is not available")
		}

		return await pulseaudioModule.getSourceOutputs()
	},
	"pulseaudio:getSourceInputs": async (ctx) => {
		const pulseaudioModule = ctx.modules.get("pulseaudio")

		if (!pulseaudioModule) {
			throw new Error("Pulseaudio module is not available")
		}

		return await pulseaudioModule.getSourceInputs()
	},

	"pipewire:getNodes": async (ctx) => {
		const pipewireModule = ctx.modules.get("pipewire")

		if (!pipewireModule) {
			throw new Error("Pipewire module is not available")
		}

		return await pipewireModule.getNodes()
	},
	"pipewire:getOutputNodes": async (ctx) => {
		const pipewireModule = ctx.modules.get("pipewire")

		if (!pipewireModule) {
			throw new Error("Pipewire module is not available")
		}

		return await pipewireModule.getOutputNodes()
	},
	"pipewire:getInputNodes": async (ctx) => {
		const pipewireModule = ctx.modules.get("pipewire")

		if (!pipewireModule) {
			throw new Error("Pipewire module is not available")
		}

		return await pipewireModule.getInputNodes()
	},

	"desktopcapturer:getAudioLoopbackRemapDeviceId": (ctx) => {
		const desktopCapturerModule = ctx.modules.get("desktopCapturer")

		if (!desktopCapturerModule) {
			throw new Error("DesktopCapturer module is not available")
		}

		return desktopCapturerModule.audioRemap
	},
	"desktopcapturer:getAudioLoopbackDeviceId": (ctx) => {
		const desktopCapturerModule = ctx.modules.get("desktopCapturer")

		if (!desktopCapturerModule) {
			throw new Error("DesktopCapturer module is not available")
		}

		return desktopCapturerModule.audioLoopback
	},
	"desktopcapturer:startSystemAudioCapture": async (ctx) => {
		const desktopCapturerModule = ctx.modules.get("desktopCapturer")

		if (!desktopCapturerModule) {
			throw new Error("DesktopCapturer module is not available")
		}

		return await desktopCapturerModule.startSystemAudioCapture()
	},
	"desktopcapturer:stopSystemAudioCapture": async (ctx) => {
		const desktopCapturerModule = ctx.modules.get("desktopCapturer")

		if (!desktopCapturerModule) {
			throw new Error("DesktopCapturer module is not available")
		}

		return await desktopCapturerModule.stopSystemAudioCapture()
	},

	"extensions:load": async (ctx, event, ...args) => {
		//return await ctx.extensions.load(...args)
	},
	"extensions:list": (ctx, event, ...args) => {
		return ctx.extensions
	},
	"extensions:install": async (ctx, event, ...args) => {
		return await ctx.extensions.install(...args)
	},
}
