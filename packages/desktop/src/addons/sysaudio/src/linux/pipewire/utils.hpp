#ifndef PIPEWIRE_UTILS_HPP
#define PIPEWIRE_UTILS_HPP

#include <spa/param/audio/format-utils.h>

#include <cstddef>
#include <cstdint>

#include "../../types.hpp"

namespace pipewire::utils {

bool is_pid_descendant_of(pid_t child_pid, pid_t target_parent_pid);
uint32_t get_bytes_per_sample(spa_audio_format format);
bool is_little_endian(spa_audio_format format);
const char *format_to_string(spa_audio_format format);
void log_audio_buffer(const void *data, size_t bytes, const AudioFormat &format, size_t buffer_number);
bool validate_buffer_size(size_t bytes, const AudioFormat &format);

}  // namespace pipewire::utils

#endif
