#include <spa/debug/types.h>

#include <iomanip>
#include <iostream>

#include "audio_utils.hpp"

namespace pipewire::audio {

uint32_t get_bytes_per_sample(spa_audio_format format) {
	switch (format) {
		case SPA_AUDIO_FORMAT_U8:
			return 1;
		case SPA_AUDIO_FORMAT_S16_LE:
		case SPA_AUDIO_FORMAT_S16_BE:
			return 2;
		case SPA_AUDIO_FORMAT_S24_32_LE:
		case SPA_AUDIO_FORMAT_S24_32_BE:
		case SPA_AUDIO_FORMAT_S32_LE:
		case SPA_AUDIO_FORMAT_S32_BE:
		case SPA_AUDIO_FORMAT_F32_LE:
		case SPA_AUDIO_FORMAT_F32_BE:
			return 4;
		case SPA_AUDIO_FORMAT_F64_LE:
		case SPA_AUDIO_FORMAT_F64_BE:
			return 8;
		default:
			std::cerr << "Warning: Unknown audio format: " << format << std::endl;
			return 0;
	}
}

bool is_little_endian(spa_audio_format format) {
	switch (format) {
		case SPA_AUDIO_FORMAT_S16_LE:
		case SPA_AUDIO_FORMAT_S24_32_LE:
		case SPA_AUDIO_FORMAT_S32_LE:
		case SPA_AUDIO_FORMAT_F32_LE:
		case SPA_AUDIO_FORMAT_F64_LE:
			return true;
		case SPA_AUDIO_FORMAT_S16_BE:
		case SPA_AUDIO_FORMAT_S24_32_BE:
		case SPA_AUDIO_FORMAT_S32_BE:
		case SPA_AUDIO_FORMAT_F32_BE:
		case SPA_AUDIO_FORMAT_F64_BE:
			return false;
		default:
			return true;
	}
}

const char *format_to_string(spa_audio_format format) {
	const char *name = spa_debug_type_find_name(spa_type_audio_format, format);
	return name ? name : "unknown";
}

void log_audio_buffer(const void *data, size_t bytes, const AudioFormat &format, size_t buffer_number) {
	if (buffer_number % 50 != 0) {
		return;
	}

	size_t bytes_per_sample = get_bytes_per_sample(static_cast<spa_audio_format>(format.format));
	size_t samples = bytes_per_sample > 0 ? bytes / bytes_per_sample : 0;
	size_t frames = format.channels > 0 ? samples / format.channels : 0;

	std::cout << "Audio buffer #" << buffer_number
			  << ": bytes=" << bytes
			  << ", samples=" << samples
			  << ", frames=" << frames
			  << ", format=" << format.format << " (" << format_to_string(static_cast<spa_audio_format>(format.format)) << ")"
			  << ", rate=" << format.sampleRate
			  << ", channels=" << format.channels
			  << ", bits=" << format.bitsPerSample
			  << ", stride=" << bytes_per_sample * format.channels
			  << ", data_ptr=" << data
			  << std::endl;

	// Log first few bytes for debugging
	if (bytes >= 32) {
		const uint8_t *raw_data = static_cast<const uint8_t *>(data);
		std::cout << "  First 32 bytes:";
		for (size_t i = 0; i < 32 && i < bytes; i++) {
			std::cout << " " << std::hex << std::setw(2) << std::setfill('0')
					  << static_cast<int>(raw_data[i]);
		}
		std::cout << std::dec << std::endl;

		// If format is float32, show float values
		if (format.format == SPA_AUDIO_FORMAT_F32_LE || format.format == SPA_AUDIO_FORMAT_F32_BE) {
			const float *float_data = static_cast<const float *>(data);
			size_t float_samples = std::min(samples, static_cast<size_t>(8));
			std::cout << "  First " << float_samples << " float samples:";
			for (size_t i = 0; i < float_samples; i++) {
				std::cout << " " << float_data[i];
			}
			std::cout << std::endl;
		}
		// If format is S16, show int16 values
		else if (format.format == SPA_AUDIO_FORMAT_S16_LE || format.format == SPA_AUDIO_FORMAT_S16_BE) {
			const int16_t *int16_data = static_cast<const int16_t *>(data);
			size_t int16_samples = std::min(samples, static_cast<size_t>(8));
			std::cout << "  First " << int16_samples << " int16 samples:";
			for (size_t i = 0; i < int16_samples; i++) {
				std::cout << " " << int16_data[i];
			}
			std::cout << std::endl;
		}
	}
}

bool validate_buffer_size(size_t bytes, const AudioFormat &format) {
	size_t bytes_per_sample = get_bytes_per_sample(static_cast<spa_audio_format>(format.format));
	if (bytes_per_sample == 0) {
		std::cerr << "Error: bytes_per_sample is 0, format=" << format.format << std::endl;
		return false;
	}

	size_t frame_size = bytes_per_sample * format.channels;
	if (frame_size == 0) {
		std::cerr << "Error: frame_size is 0, channels=" << format.channels << std::endl;
		return false;
	}

	if (bytes % frame_size != 0) {
		std::cerr << "Warning: Buffer size " << bytes << " not multiple of frame size "
				  << frame_size << " (channels=" << format.channels
				  << ", bytes_per_sample=" << bytes_per_sample << ")" << std::endl;
		return false;
	}

	return true;
}

}  // namespace pipewire::audio
