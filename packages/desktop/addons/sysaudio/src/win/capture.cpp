#include <sys/types.h>

#include <cstdio>
#include <cstring>

#include "capture.hpp"

#undef VIRTUAL_AUDIO_DEVICE_PROCESS_LOOPBACK
#define VIRTUAL_AUDIO_DEVICE_PROCESS_LOOPBACK L"VAD\\Process_Loopback"

void LogComError(const char *msg, HRESULT hr) {
	_com_error err(hr);
	printf("[WASAPI DEBUG] %s. HRESULT: 0x%08X - %s\n", msg, hr, err.ErrorMessage());
}

void LogDebug(const char *msg) {
	printf("[WASAPI DEBUG] %s\n", msg);
}

class AudioActivator : public IActivateAudioInterfaceCompletionHandler, public IAgileObject {
   private:
	LONG m_refCount;

   public:
	IAudioClient *pAudioClient;
	HANDLE hEvent;
	HRESULT activateResult;

	AudioActivator() : m_refCount(1), pAudioClient(nullptr), activateResult(E_FAIL) {
		hEvent = CreateEvent(NULL, FALSE, FALSE, NULL);
	}

	virtual ~AudioActivator() {
		if (hEvent) CloseHandle(hEvent);
		if (pAudioClient) pAudioClient->Release();
	}

	ULONG STDMETHODCALLTYPE AddRef() override {
		return InterlockedIncrement(&m_refCount);
	}

	ULONG STDMETHODCALLTYPE Release() override {
		ULONG ref = InterlockedDecrement(&m_refCount);

		if (ref == 0) {
			delete this;
		}

		return ref;
	}

	HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void **ppv) override {
		if (!ppv) {
			return E_POINTER;
		}

		if (riid == __uuidof(IUnknown) || riid == __uuidof(IActivateAudioInterfaceCompletionHandler)) {
			*ppv = static_cast<IActivateAudioInterfaceCompletionHandler *>(this);
		} else if (riid == __uuidof(IAgileObject)) {
			*ppv = static_cast<IAgileObject *>(this);
		} else {
			*ppv = nullptr;
			return E_NOINTERFACE;
		}

		AddRef();
		return S_OK;
	}

	HRESULT STDMETHODCALLTYPE ActivateCompleted(IActivateAudioInterfaceAsyncOperation *operation) override {
		HRESULT hr = S_OK;
		IUnknown *pUnk = nullptr;

		hr = operation->GetActivateResult(&activateResult, &pUnk);

		if (SUCCEEDED(hr) && SUCCEEDED(activateResult) && pUnk != nullptr) {
			pUnk->QueryInterface(__uuidof(IAudioClient), (void **)&pAudioClient);
		} else {
			LogComError("Failed to asyncronusly activate audio interface", activateResult);
		}

		if (pUnk) {
			pUnk->Release();
		}

		SetEvent(hEvent);
		return S_OK;
	}
};

WasapiCapture::WasapiCapture() : m_isCapturing(false), m_pAudioClient(nullptr), m_pCaptureClient(nullptr), m_pwfx(nullptr) {}
WasapiCapture::~WasapiCapture() { Stop(); }

bool WasapiCapture::Start(DWORD processIdToExclude, AudioDataCallback callback) {
	if (m_isCapturing) return false;

	m_processIdToExclude = processIdToExclude;
	m_callback = callback;
	m_isCapturing = true;
	m_captureThread = std::thread(&WasapiCapture::CaptureThread, this);

	return true;
}

void WasapiCapture::Stop() {
	if (m_isCapturing) {
		m_isCapturing = false;
		if (m_captureThread.joinable()) {
			m_captureThread.join();
		}
	}
}

void WasapiCapture::CaptureThread() {
	HRESULT hr = CoInitializeEx(NULL, COINIT_MULTITHREADED);

	if (FAILED(hr)) {
		LogComError("WasapiCapture::CaptureThread: CoInitializeEx failed", hr);
		return;
	}

	AUDIOCLIENT_PROCESS_LOOPBACK_PARAMS loopbackParams = {};

	printf("[WASAPI DEBUG] Using process loopback | Excluded PID: %u\n", m_processIdToExclude);
	loopbackParams.TargetProcessId = m_processIdToExclude;
	loopbackParams.ProcessLoopbackMode = PROCESS_LOOPBACK_MODE_EXCLUDE_TARGET_PROCESS_TREE;

	AUDIOCLIENT_ACTIVATION_PARAMS activationParams = {};
	activationParams.ActivationType = AUDIOCLIENT_ACTIVATION_TYPE_PROCESS_LOOPBACK;
	activationParams.ProcessLoopbackParams = loopbackParams;

	PROPVARIANT activateParams;
	PropVariantInit(&activateParams);
	activateParams.vt = VT_BLOB;
	activateParams.blob.cbSize = sizeof(activationParams);
	activateParams.blob.pBlobData = (BYTE *)&activationParams;

	AudioActivator *activator = new AudioActivator();
	IActivateAudioInterfaceAsyncOperation *pAsyncOp = nullptr;

	hr = ActivateAudioInterfaceAsync(
		VIRTUAL_AUDIO_DEVICE_PROCESS_LOOPBACK,
		__uuidof(IAudioClient),
		&activateParams,
		activator,
		&pAsyncOp
	);

	if (FAILED(hr)) {
		LogComError("WasapiCapture::CaptureThread: ActivateAudioInterfaceAsync failed", hr);
		activator->Release();
		CoUninitialize();
		return;
	}

	WaitForSingleObject(activator->hEvent, INFINITE);
	printf("[WASAPI DEBUG] Activation completed with result: 0x%08X\n", activator->activateResult);

	if (FAILED(activator->activateResult) || !activator->pAudioClient) {
		LogComError("WasapiCapture::CaptureThread: callback rejected", activator->activateResult);

		if (pAsyncOp) {
			pAsyncOp->Release();
		}

		activator->Release();
		CoUninitialize();
		return;
	}

	printf("[WASAPI DEBUG] Audio client activated successfully\n");

	m_pAudioClient = activator->pAudioClient;
	m_pAudioClient->AddRef();
	if (pAsyncOp) pAsyncOp->Release();
	activator->Release();

	WAVEFORMATEX *pMixFormat = nullptr;
	hr = m_pAudioClient->GetMixFormat(&pMixFormat);

	WAVEFORMATEXTENSIBLE defaultWfx = {};
	WAVEFORMATEX simpleFormat = {};
	WAVEFORMATEX *pFormat = nullptr;

	if (FAILED(hr) || !pMixFormat) {
		// Use default format
		defaultWfx.Format.wFormatTag = WAVE_FORMAT_EXTENSIBLE;
		defaultWfx.Format.nChannels = 2;
		defaultWfx.Format.nSamplesPerSec = 48000;
		defaultWfx.Format.wBitsPerSample = 32;
		defaultWfx.Format.nBlockAlign = (defaultWfx.Format.nChannels * defaultWfx.Format.wBitsPerSample) / 8;
		defaultWfx.Format.nAvgBytesPerSec = defaultWfx.Format.nSamplesPerSec * defaultWfx.Format.nBlockAlign;
		defaultWfx.Format.cbSize = sizeof(WAVEFORMATEXTENSIBLE) - sizeof(WAVEFORMATEX);
		defaultWfx.Samples.wValidBitsPerSample = 32;
		defaultWfx.dwChannelMask = 3;
		defaultWfx.SubFormat = GUID_SUBTYPE_IEEE_FLOAT;

		pFormat = &defaultWfx.Format;

		printf("[WASAPI DEBUG] Using default format: %d channels, %d Hz, %d bits\n", pFormat->nChannels, pFormat->nSamplesPerSec, pFormat->wBitsPerSample);
	} else {
		printf("[WASAPI DEBUG] Got mix format: %d channels, %d Hz, %d bits, tag: 0x%04X\n", pMixFormat->nChannels, pMixFormat->nSamplesPerSec, pMixFormat->wBitsPerSample, pMixFormat->wFormatTag);

		if (pMixFormat->wFormatTag == WAVE_FORMAT_EXTENSIBLE && pMixFormat->cbSize >= 22) {
			WAVEFORMATEXTENSIBLE *pwfx = (WAVEFORMATEXTENSIBLE *)pMixFormat;
		}

		pFormat = pMixFormat;
	}

	DWORD flags = AUDCLNT_STREAMFLAGS_LOOPBACK | AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM | AUDCLNT_STREAMFLAGS_SRC_DEFAULT_QUALITY;
	// Calculate buffer duration (100ms = 10,000,000 hundred-nanosecond units)
	REFERENCE_TIME bufferDuration = 10000000;  // 100ms

	hr = m_pAudioClient->Initialize(AUDCLNT_SHAREMODE_SHARED, flags, bufferDuration, 0, pFormat, NULL);

	if (FAILED(hr)) {
		LogComError("WasapiCapture::CaptureThread: Failed to initialize audio client", hr);
		return;
	}

	if (pMixFormat) {
		CoTaskMemFree(pMixFormat);
		pMixFormat = nullptr;
	}

	hr = m_pAudioClient->GetService(__uuidof(IAudioCaptureClient), (void **)&m_pCaptureClient);

	if (FAILED(hr)) {
		LogComError("WasapiCapture::CaptureThread: GetService failed", hr);
		goto Cleanup;
	}

	hr = m_pAudioClient->Start();

	if (FAILED(hr)) {
		LogComError("WasapiCapture::CaptureThread: audio client start failed", hr);
		goto Cleanup;
	}

	// Get the actual buffer size
	UINT32 bufferFrameCount;
	hr = m_pAudioClient->GetBufferSize(&bufferFrameCount);

	// Get the device period
	REFERENCE_TIME defaultPeriod, minimumPeriod;
	hr = m_pAudioClient->GetDevicePeriod(&defaultPeriod, &minimumPeriod);

	while (m_isCapturing) {
		UINT32 packetLength = 0;
		hr = m_pCaptureClient->GetNextPacketSize(&packetLength);

		if (FAILED(hr)) {
			LogComError("GetNextPacketSize failed", hr);
			break;
		}

		while (packetLength != 0 && m_isCapturing) {
			BYTE *pData;
			UINT32 numFramesAvailable;
			DWORD bufferFlags;
			UINT64 devicePosition;
			UINT64 qpcPosition;

			hr = m_pCaptureClient->GetBuffer(&pData, &numFramesAvailable, &bufferFlags, &devicePosition, &qpcPosition);

			AudioFormat *aFormat = new AudioFormat;

			aFormat->sampleRate = pFormat->nSamplesPerSec;
			aFormat->bitsPerSample = pFormat->wBitsPerSample;
			aFormat->channels = pFormat->nChannels;

			AudioFrame *aFrame = new AudioFrame;

			aFrame->format = aFormat;
			aFrame->size = numFramesAvailable * pFormat->nBlockAlign;

			if (SUCCEEDED(hr)) {
				if (numFramesAvailable > 0) {
					// Always copy the buffer data to ensure it remains valid after ReleaseBuffer
					size_t bufferSize = numFramesAvailable * pFormat->nBlockAlign;
					uint8_t *bufferCopy = new uint8_t[bufferSize];

					if (bufferFlags & AUDCLNT_BUFFERFLAGS_SILENT) {
						memset(bufferCopy, 0, bufferSize);
					} else {
						memcpy(bufferCopy, pData, bufferSize);
					}

					aFrame->buff = bufferCopy;
					aFrame->size = bufferSize;

					m_callback(aFrame);
					m_pCaptureClient->ReleaseBuffer(numFramesAvailable);
				} else {
					printf("[WASAPI DEBUG] No frames available in buffer\n");

					delete aFrame->format;
					delete aFrame;
					m_pCaptureClient->ReleaseBuffer(0);
				}
			} else {
				printf("[WASAPI DEBUG] GetBuffer failed\n");
				delete aFrame->format;
				delete aFrame;
			}

			hr = m_pCaptureClient->GetNextPacketSize(&packetLength);

			if (FAILED(hr)) {
				LogComError("GetNextPacketSize failed in loop", hr);
				break;
			}
		}

		// Only sleep if there are no packets to process
		if (packetLength == 0) {
			Sleep(10);
		}
	}

	m_pAudioClient->Stop();

Cleanup:
	if (m_pCaptureClient) {
		m_pCaptureClient->Release();
		m_pCaptureClient = nullptr;
	}

	if (m_pAudioClient) {
		m_pAudioClient->Stop();
		m_pAudioClient->Release();
		m_pAudioClient = nullptr;
	}

	if (pMixFormat) {
		CoTaskMemFree(pMixFormat);
		pMixFormat = nullptr;
	}

	CoUninitialize();

	printf("[WASAPI DEBUG] Capture thread ended\n");
}

void WasapiCapture::SendMockData() {
}
