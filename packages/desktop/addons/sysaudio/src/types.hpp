#ifndef AUDIOCALLBACK_HPP
#define AUDIOCALLBACK_HPP

#include <functional>
#include <cstdint>

struct AudioFormat {
    uint32_t sampleRate;
    uint32_t channels;
    uint32_t bitsPerSample;
    uint32_t format; // spa_audio_format value
};

struct AudioFrame {
	uint8_t *buff;
	AudioFormat *format;
	size_t size;
};

using AudioDataCallback = std::function<void(AudioFrame *frame)>;

#endif // AUDIOCALLBACK_HPP
