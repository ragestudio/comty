#include <spa/param/audio/format-utils.h>
#include <sys/types.h>

#include <cstddef>
#include <cstdint>
#include <memory>

#include "../types.hpp"
#include "pipewire/main.hpp"

#define INPUT_NODE_NAME "comty-sysaudio"

// forward declaration of implementation
namespace pipewire {
class PipewireAudio;
}

class SysAudioLinux {
   public:
	SysAudioLinux();
	~SysAudioLinux();

	// disable copying
	SysAudioLinux(const SysAudioLinux &) = delete;
	SysAudioLinux &operator=(const SysAudioLinux &) = delete;

	void Stop();

	bool StartCapture(pid_t excludePid, AudioDataCallback dataCallback);
	void StopCapture();

	void Output(AudioFrame *frame);

	// audio format accessors
	void SetAudioFormat(spa_audio_format format, uint32_t rate, uint32_t channels);
	spa_audio_format GetFormat() const;
	uint32_t GetSampleRate() const;
	uint32_t GetChannels() const;
	size_t GetBytesPerSample() const;
	AudioFormat GetCurrentFormat() const;

   private:
	std::unique_ptr<pipewire::PipewireAudio> impl;
};
