{
	"targets": [
		{
			"target_name": "sysaudio",
			"sources": ["src/addon.cpp"],
			"include_dirs": ["<!@(node -p \"require('node-addon-api').include\")"],
			"conditions": [
				[
					"OS=='win'",
					{
						"sources": ["src/win/capture.cpp"],
						"libraries": ["-lMmdevapi.lib", "-lOle32.lib"],
						"msvs_settings": {
							"VCCLCompilerTool": {
								"ExceptionHandling": 1,
								"DisableSpecificWarnings": ["4005"]
							}
						},
						"defines": ["_WIN32_WINNT=0x0A00", "NTDDI_VERSION=0x0A00000C"]
					}
				],
				[
					"OS=='linux'",
					{
						"sources": [
							"src/linux/engine.cpp",
							"src/linux/pipewire/utils.cpp",
							"src/linux/pipewire/router.cpp",
							"src/linux/pipewire/input.cpp",
							"src/linux/pipewire/output.cpp",
							"src/linux/pipewire/main.cpp"
						],
						"libraries": ["-lpipewire-0.3"],
						"include_dirs": [
							"/usr/include/pipewire-0.3",
							"/usr/include/spa-0.2"
						]
					}
				]
			],
			"cflags!": ["-fno-exceptions", "-Wall", "-g", "-std=c11"],
			"cflags_cc!": ["-fno-exceptions"]
		}
	]
}
