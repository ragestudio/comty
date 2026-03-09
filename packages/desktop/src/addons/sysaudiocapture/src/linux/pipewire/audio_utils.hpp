#ifndef PIPEWIRE_AUDIO_UTILS_HPP
#define PIPEWIRE_AUDIO_UTILS_HPP

#include <spa/param/audio/format-utils.h>

#include <cstddef>
#include <cstdint>

#include "../../types.hpp"

namespace pipewire::audio {

// get bytes per sample for given format
uint32_t get_bytes_per_sample(spa_audio_format format);

// check if format is little-endian
bool is_little_endian(spa_audio_format format);

// convert format enum to string
const char *format_to_string(spa_audio_format format);

// log audio buffer information for debugging
void log_audio_buffer(const void *data, size_t bytes, const AudioFormat &format, size_t buffer_number);

// validate buffer size against format
bool validate_buffer_size(size_t bytes, const AudioFormat &format);

}  // namespace pipewire::audio

#endif	// PIPEWIRE_AUDIO_UTILS_HPP
