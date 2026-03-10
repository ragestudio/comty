#include <spa/param/audio/format-utils.h>
#include <sys/types.h>

#include <cstddef>
#include <cstdint>
#include <memory>

#include "../types.hpp"

#define INPUT_NODE_NAME "comty-sysaudio"

// forward declaration of implementation
namespace pipewire {
class CaptureImpl;
}

class Capture {
   public:
	Capture();
	~Capture();

	// disable copying
	Capture(const Capture &) = delete;
	Capture &operator=(const Capture &) = delete;

	bool Start(pid_t excludePid, AudioDataCallback dataCallback);
	void Stop();
	void SendMockData();

	// audio format accessors
	void SetAudioFormat(spa_audio_format format, uint32_t rate, uint32_t channels);
	spa_audio_format GetFormat() const;
	uint32_t GetSampleRate() const;
	uint32_t GetChannels() const;
	size_t GetBytesPerSample() const;
	AudioFormat GetCurrentFormat() const;

   private:
	std::unique_ptr<pipewire::CaptureImpl> impl;
};
