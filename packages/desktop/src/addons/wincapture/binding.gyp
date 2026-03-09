{
  "targets":[
    {
      "target_name": "wincapture",
      "sources":[
        "src/capture.cpp",
        "src/addon.cpp"
      ],
      "include_dirs":[
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies":[
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "libraries":[
        "-lMmdevapi.lib",
        "-lOle32.lib"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!":[ "-fno-exceptions" ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
          "DisableSpecificWarnings":[ "4005" ]
        }
      },
    "defines":[
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "_WIN32_WINNT=0x0A00",
        "NTDDI_VERSION=0x0A00000C"
      ]
    }
  ]
}
