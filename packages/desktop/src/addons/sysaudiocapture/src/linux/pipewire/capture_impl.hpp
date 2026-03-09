#ifndef PIPEWIRE_CAPTURE_IMPL_HPP
#define PIPEWIRE_CAPTURE_IMPL_HPP

#include <pipewire/core.h>
#include <pipewire/device.h>
#include <pipewire/keys.h>
#include <pipewire/pipewire.h>
#include <pipewire/properties.h>
#include <pipewire/stream.h>
#include <spa/param/audio/format-utils.h>
#include <spa/utils/hook.h>
#include <sys/types.h>

#include <atomic>
#include <thread>

#include "../../types.hpp"

#define INPUT_NODE_NAME "comty-sysaudio"

namespace pipewire {

class CaptureImpl {
   public:
	CaptureImpl();
	~CaptureImpl();

	// disable copying
	CaptureImpl(const CaptureImpl &) = delete;
	CaptureImpl &operator=(const CaptureImpl &) = delete;

	bool start(pid_t exclude_pid, AudioDataCallback callback);
	void stop();

	uint32_t get_format() const { return current_format; }
	uint32_t get_sample_rate() const { return current_rate; }
	uint32_t get_channels() const { return current_channels; }
	size_t get_bytes_per_sample() const;
	void send_mock_data();

   private:
	bool create_input_node();
	void cleanup();

	void process_audio();
	void handle_param_change(uint32_t id, const struct spa_pod *param);
	void handle_state_change(enum pw_stream_state old, enum pw_stream_state state, const char *error);

	friend void on_process(void *userdata);
	friend void on_param_changed(void *userdata, uint32_t id, const struct spa_pod *param);
	friend void on_state_changed(void *userdata, enum pw_stream_state old, enum pw_stream_state state, const char *error);

	// capture state
	std::atomic<bool> is_capturing;
	pid_t excluded_pid;

	// pipewire objects
	pw_loop *loop;
	pw_context *context;
	pw_core *core;
	pw_stream *stream;
	spa_hook stream_listener;

	// audio format state
	uint32_t current_format;
	uint32_t current_rate;
	uint32_t current_channels;

	// threading
	std::thread capture_thread;

	// user callback
	AudioDataCallback data_callback;
};

}  // namespace pipewire

#endif	// PIPEWIRE_CAPTURE_IMPL_HPP
