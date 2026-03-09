#include <napi.h>

#include "capture.hpp"

struct AudioFrame {
	float *data;
	size_t length;
	int channels;
	int sampleRate;
};

WasapiCapture captureInstance;
Napi::ThreadSafeFunction tsfn;

Napi::Value StartCapture(const Napi::CallbackInfo &info) {
	Napi::Env env = info.Env();

	if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsFunction()) {
		Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
		return env.Undefined();
	}

	DWORD pid = info[0].As<Napi::Number>().Uint32Value();
	Napi::Function jsCallback = info[1].As<Napi::Function>();

	tsfn = Napi::ThreadSafeFunction::New(
		env, jsCallback, "AudioCaptureTSFN", 0, 1
	);

	auto onAudioData = [](float *pData, size_t numFrames, int channels, int sampleRate) {
		size_t totalSamples = numFrames * channels;
		float *copiedData = new float[totalSamples];
		memcpy(copiedData, pData, totalSamples * sizeof(float));

		AudioFrame *frame = new AudioFrame{ copiedData, totalSamples, channels, sampleRate };

		auto jsCall = [](Napi::Env env, Napi::Function jsCb, AudioFrame *frameData) {
			size_t byteLength = frameData->length * sizeof(float);
			Napi::ArrayBuffer arrayBuffer = Napi::ArrayBuffer::New(env, byteLength);
			memcpy(arrayBuffer.Data(), frameData->data, byteLength);

			Napi::Float32Array floatArray = Napi::Float32Array::New(env, frameData->length, arrayBuffer, 0);

			jsCb.Call({ floatArray, Napi::Number::New(env, frameData->channels), Napi::Number::New(env, frameData->sampleRate) });

			delete[] frameData->data;
			delete frameData;
		};
		tsfn.BlockingCall(frame, jsCall);
	};

	bool success = captureInstance.Start(pid, onAudioData);
	printf("[WASAPI DEBUG] StartCapture: success=%d\n", success);

	return Napi::Boolean::New(env, success);
}

Napi::Value StopCapture(const Napi::CallbackInfo &info) {
	captureInstance.Stop();

	if (tsfn) {
		tsfn.Release();
	}

	printf("[WASAPI DEBUG] StopCapture: tsfn released\n");

	return info.Env().Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
	exports.Set("start", Napi::Function::New(env, StartCapture));
	exports.Set("stop", Napi::Function::New(env, StopCapture));
	return exports;
}

NODE_API_MODULE(wasapi_loopback, Init)
