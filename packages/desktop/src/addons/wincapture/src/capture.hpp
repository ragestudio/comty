#include <audioclient.h>
#include <audioclientactivationparams.h>
#include <mmdeviceapi.h>
#include <windows.h>

#include <atomic>
#include <functional>
#include <thread>

const GUID GUID_SUBTYPE_IEEE_FLOAT = {
	0x00000003, 0x0000, 0x0010, { 0x80, 0x00, 0x00, 0xAA, 0x00, 0x38, 0x9B, 0x71 }
};

const GUID GUID_SUBTYPE_PCM = {
	0x00000001, 0x0000, 0x0010, { 0x80, 0x00, 0x00, 0xAA, 0x00, 0x38, 0x9B, 0x71 }
};

using AudioDataCallback = std::function<void(float *pData, size_t numFrames, int channels, int sampleRate)>;

class WasapiCapture {
   public:
	WasapiCapture();
	~WasapiCapture();

	bool Start(DWORD processIdToExclude, AudioDataCallback callback);
	void Stop();

   private:
	void CaptureThread();

	std::thread m_captureThread;
	std::atomic<bool> m_isCapturing;
	DWORD m_processIdToExclude;
	AudioDataCallback m_callback;

	IAudioClient *m_pAudioClient;
	IAudioCaptureClient *m_pCaptureClient;
	WAVEFORMATEX *m_pwfx;
};
