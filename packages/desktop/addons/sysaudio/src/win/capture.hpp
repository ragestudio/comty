#ifdef __linux
#define INC_OLE2 true
#define NTDDI_VERSION 0x0A00000A
#endif

#ifdef _WIN32
#include <comdef.h>
#endif

#include <audioclient.h>
#include <audioclientactivationparams.h>
#include <initguid.h>
#include <mmdeviceapi.h>
#include <windows.h>

#include <atomic>
#include <thread>

#include "../types.hpp"

const GUID GUID_SUBTYPE_IEEE_FLOAT = {
	0x00000003, 0x0000, 0x0010, { 0x80, 0x00, 0x00, 0xAA, 0x00, 0x38, 0x9B, 0x71 }
};

const GUID GUID_SUBTYPE_PCM = {
	0x00000001, 0x0000, 0x0010, { 0x80, 0x00, 0x00, 0xAA, 0x00, 0x38, 0x9B, 0x71 }
};

class WasapiCapture {
   public:
	WasapiCapture();
	~WasapiCapture();

	bool Start(DWORD processIdToExclude, AudioDataCallback callback);
	void Stop();
	void SendMockData();

   private:
	void CaptureThread();
	void CaptureRegularLoopback();
	void SetupAndCaptureAudio();
	void TestAudioPlayback();

	std::thread m_captureThread;
	std::atomic<bool> m_isCapturing;
	DWORD m_processIdToExclude;
	AudioDataCallback m_callback;

	IAudioClient *m_pAudioClient;
	IAudioCaptureClient *m_pCaptureClient;
	WAVEFORMATEX *m_pwfx;
};
