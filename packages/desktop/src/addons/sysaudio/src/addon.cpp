#include <iostream>
#include <thread>

#include "napi.h"
#include "types.hpp"

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

void onAudioDataCallbackFn(Napi::Env env, Napi::Function jsCb, AudioFrame *frame) {
	if (env != nullptr && jsCb != nullptr) {
		Napi::Buffer<uint8_t> buffer = Napi::Buffer<uint8_t>::Copy(env, frame->buff, frame->size);

		Napi::Object formatObj = Napi::Object::New(env);
		formatObj.Set("sampleRate", Napi::Number::New(env, frame->format->sampleRate));
		formatObj.Set("channels", Napi::Number::New(env, frame->format->channels));
		formatObj.Set("bitsPerSample", Napi::Number::New(env, frame->format->bitsPerSample));
		// formatObj.Set("format", Napi::Number::New(env, frame->format.format));

		// printf("Frame size: %zu\n", frame->size);
		// printf("Frame buffer: %p\n", frame->buff);

		jsCb.Call({ buffer, formatObj });
	}

	if (frame) {
		// if (frame->buff) {
		//     free(frame->buff);
		// }
		delete frame->format;
		delete frame;
	}
};

Napi::Value StartCapture(const Napi::CallbackInfo &info) {
	Napi::Env env = info.Env();

	if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsFunction()) {
		Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
		return env.Undefined();
	}

	int pid = info[0].As<Napi::Number>().Int32Value();

#ifdef _WIN32
	pid = static_cast<DWORD>(pid);
#endif

#ifdef __linux
	pid = static_cast<pid_t>(pid);
#endif

	audioCaptureDataCallback = Napi::ThreadSafeFunction::New(
		env,
		info[1].As<Napi::Function>(),
		"audioCaptureDataCallback",
		0,
		1
	);

	auto onAudioData = [](AudioFrame *frame) {
		napi_status status = audioCaptureDataCallback.BlockingCall(frame, onAudioDataCallbackFn);

		if (status != napi_ok) {
			delete[] frame->buff;
			delete frame->format;
			delete frame;
		}
	};

	std::thread([onAudioData, pid]() {
		bool success = captureInstance.Start(pid, onAudioData);
		printf("[SYSAUDIOCAPTURE] StartCapture: success=%d\n", success);
	}).detach();

	return Napi::Boolean::New(env, true);
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

NODE_API_MODULE(sysaudio, Init)
