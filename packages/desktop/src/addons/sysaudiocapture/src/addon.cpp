#include <cstring>

#include "../node_modules/node-addon-api/napi.h"

#ifdef _WIN32
#define OS "win32"
#define IS_WINDOWS
#include "win/capture.hpp"
#endif

#ifdef __linux
#define OS "linux"
#include "linux/capture.hpp"
#define IS_LINUX
#endif

#ifdef _WIN32
WasapiCapture captureInstance;
#endif

#ifdef __linux
Capture captureInstance;
#endif



Napi::ThreadSafeFunction audioCaptureDataCallback;

auto onAudioDataCallbackFn = [](Napi::Env env, Napi::Function jsCb, AudioFrame *frame) {
	Napi::Buffer<uint8_t> buffer = Napi::Buffer<uint8_t>::New(
		env,
		frame->buff,
		frame->size,
		[](Napi::Env, void *finalizeData) {
			delete[] static_cast<uint8_t *>(finalizeData);
		}
	);

	Napi::Object formatObj = Napi::Object::New(env);
	formatObj.Set("sampleRate", Napi::Number::New(env, frame->format.sampleRate));
	formatObj.Set("channels", Napi::Number::New(env, frame->format.channels));
	formatObj.Set("bitsPerSample", Napi::Number::New(env, frame->format.bitsPerSample));
	formatObj.Set("format", Napi::Number::New(env, frame->format.format));

	jsCb.Call({ buffer, formatObj });

	delete frame;
};

Napi::Value StartCapture(const Napi::CallbackInfo &info) {
	Napi::Env env = info.Env();

	if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsFunction()) {
		Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
		return env.Undefined();
	}

	int pid = info[0].As<Napi::Number>().Int32Value();

#ifdef _WIN32
	pid = static_cast<DWORD>(info[0].As<Napi::Number>().Uint32Value());
#endif

#ifdef __linux
	pid = static_cast<pid_t>(info[0].As<Napi::Number>().Int32Value());
#endif

	Napi::Function jsCallback = info[1].As<Napi::Function>();

	audioCaptureDataCallback = Napi::ThreadSafeFunction::New(
		env, jsCallback, "audioCaptureDataCallback", 0, 2
	);

	auto onAudioData = [](const void *pData, size_t dataSize, const AudioFormat &format) {
		// create a copy of the audio data to ensure it remains valid
		uint8_t *audioCopy = new uint8_t[dataSize];
		memcpy(audioCopy, pData, dataSize);

		AudioFrame *frame = new AudioFrame{
			audioCopy,
			dataSize,
			format
		};

		napi_status status = audioCaptureDataCallback.NonBlockingCall(frame, onAudioDataCallbackFn);

		if (status != napi_ok) {
			delete[] audioCopy;
			delete frame;
		}
	};

	bool success = captureInstance.Start(pid, onAudioData);
	printf("[SYSAUDIOCAPTURE] StartCapture: success=%d\n", success);

	return Napi::Boolean::New(env, success);
}

Napi::Value StopCapture(const Napi::CallbackInfo &info) {
	captureInstance.Stop();

	if (audioCaptureDataCallback) {
		audioCaptureDataCallback.Release();
	}

	printf("[SYSAUDIOCAPTURE] StopCapture: tsfn released\n");

	return info.Env().Undefined();
}

Napi::Value SendMockData(const Napi::CallbackInfo &info) {
	captureInstance.SendMockData();
	return info.Env().Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
	exports.Set("start", Napi::Function::New(env, StartCapture));
	exports.Set("stop", Napi::Function::New(env, StopCapture));
	exports.Set("send_mock_data", Napi::Function::New(env, SendMockData));
	return exports;
}

NODE_API_MODULE(wasapi_loopback, Init)
