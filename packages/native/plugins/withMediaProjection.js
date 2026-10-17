const {
	AndroidConfig,
	createRunOncePlugin,
	withMainApplication,
} = require("expo/config-plugins")

const pkg = { name: "with-media-projection", version: "1.0.0" }

const FLAG =
	"WebRTCModuleOptions.getInstance().enableMediaProjectionService = true"

// screen sharing on Android 14+ needs webrtc's media projection foreground
// service, but the library only starts it when enableMediaProjectionService is
// set early in the application. the android project is regenerated on prebuild,
// so the flag has to be injected through a config plugin instead of hand edited.
const withMediaProjectionFlag = (config) =>
	withMainApplication(config, (config) => {
		const isJava = config.modResults.language === "java"

		const importLine = isJava
			? "import com.oney.WebRTCModule.WebRTCModuleOptions;"
			: "import com.oney.WebRTCModule.WebRTCModuleOptions"

		const optionLine = isJava ? `${FLAG};` : FLAG

		let contents = config.modResults.contents

		if (!contents.includes("com.oney.WebRTCModule.WebRTCModuleOptions")) {
			contents = contents.replace(
				/^package .+$/m,
				(match) => `${match}\n${importLine}`,
			)
		}

		if (!contents.includes(FLAG)) {
			const onCreate = isJava
				? /(void onCreate\(\)\s*\{\s*\n\s*super\.onCreate\(\);\s*\n)/
				: /(override fun onCreate\(\)\s*\{\s*\n\s*super\.onCreate\(\)\s*\n)/

			contents = contents.replace(onCreate, (match) => {
				return `${match}\n    ${optionLine}\n`
			})
		}

		config.modResults.contents = contents

		return config
	})

module.exports = createRunOncePlugin(
	(config) => {
		config = AndroidConfig.Permissions.withPermissions(config, [
			"android.permission.FOREGROUND_SERVICE",
			"android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
		])

		config = withMediaProjectionFlag(config)

		return config
	},
	pkg.name,
	pkg.version,
)
