#include <comdef.h>
#include <initguid.h>

#include "capture.hpp"

#undef VIRTUAL_AUDIO_DEVICE_PROCESS_LOOPBACK
#define VIRTUAL_AUDIO_DEVICE_PROCESS_LOOPBACK L"VAD\\Process_Loopback"

void LogComError(const char *msg, HRESULT hr) {
	_com_error err(hr);
	printf("[WASAPI DEBUG] %s. HRESULT: 0x%08X - %s\n", msg, hr, err.ErrorMessage());
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
			LogComError("La activacion asincrona interna fallo", activateResult);
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

	if (FAILED(activator->activateResult) || !activator->pAudioClient) {
		LogComError("WasapiCapture::CaptureThread: callback rejected", activator->activateResult);

		if (pAsyncOp) {
			pAsyncOp->Release();
		}

		activator->Release();
		CoUninitialize();
		return;
	}

	m_pAudioClient = activator->pAudioClient;
	m_pAudioClient->AddRef();
	if (pAsyncOp) pAsyncOp->Release();
	activator->Release();

	WAVEFORMATEXTENSIBLE wfx = {};
	wfx.Format.wFormatTag = WAVE_FORMAT_EXTENSIBLE;
	wfx.Format.nChannels = 2;
	wfx.Format.nSamplesPerSec = 48000;
	wfx.Format.wBitsPerSample = 32;
	wfx.Format.nBlockAlign = (wfx.Format.nChannels * wfx.Format.wBitsPerSample) / 8;
	wfx.Format.nAvgBytesPerSec = wfx.Format.nSamplesPerSec * wfx.Format.nBlockAlign;
	wfx.Format.cbSize = sizeof(WAVEFORMATEXTENSIBLE) - sizeof(WAVEFORMATEX);
	wfx.Samples.wValidBitsPerSample = 32;
	wfx.dwChannelMask = 3;
	wfx.SubFormat = GUID_SUBTYPE_IEEE_FLOAT;

	WAVEFORMATEX *pFormat = &wfx.Format;

	DWORD flags = AUDCLNT_STREAMFLAGS_LOOPBACK | AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM | AUDCLNT_STREAMFLAGS_SRC_DEFAULT_QUALITY;

	hr = m_pAudioClient->Initialize(AUDCLNT_SHAREMODE_SHARED, flags, 10000000, 0, pFormat, NULL);

	if (FAILED(hr)) {
		LogComError("Initialize fallo", hr);
		goto Cleanup;
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

	while (m_isCapturing) {
		UINT32 packetLength = 0;
		hr = m_pCaptureClient->GetNextPacketSize(&packetLength);

		while (packetLength != 0 && m_isCapturing) {
			BYTE *pData;
			UINT32 numFramesAvailable;
			DWORD bufferFlags;

			hr = m_pCaptureClient->GetBuffer(&pData, &numFramesAvailable, &bufferFlags, NULL, NULL);

			if (SUCCEEDED(hr)) {
				if (bufferFlags & AUDCLNT_BUFFERFLAGS_SILENT) {
					std::vector<float> silentBuffer(numFramesAvailable * pFormat->nChannels, 0.0f);
					m_callback(silentBuffer.data(), numFramesAvailable, pFormat->nChannels, pFormat->nSamplesPerSec);
				} else {
					float *floatData = reinterpret_cast<float *>(pData);
					m_callback(floatData, numFramesAvailable, pFormat->nChannels, pFormat->nSamplesPerSec);
				}

				m_pCaptureClient->ReleaseBuffer(numFramesAvailable);
			}

			m_pCaptureClient->GetNextPacketSize(&packetLength);
		}

		Sleep(10);
	}

	m_pAudioClient->Stop();

Cleanup:
	if (m_pCaptureClient) {
		m_pCaptureClient->Release();
		m_pCaptureClient = nullptr;
	}

	if (m_pAudioClient) {
		m_pAudioClient->Release();
		m_pAudioClient = nullptr;
	}

	CoUninitialize();
}
