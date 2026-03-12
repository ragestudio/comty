#ifndef PIPEWIRE_CAPTURE_IMPL_HPP
#define PIPEWIRE_CAPTURE_IMPL_HPP

#include <pipewire/core.h>
#include <pipewire/device.h>
#include <pipewire/keys.h>
#include <pipewire/main-loop.h>
#include <pipewire/pipewire.h>
#include <pipewire/properties.h>
#include <pipewire/stream.h>
#include <spa/param/audio/format-utils.h>
#include <spa/utils/hook.h>
#include <sys/types.h>

#include <atomic>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include "../../types.hpp"
#include "ringbuffer.hpp"

#define INPUT_NODE_NAME "comty-sysaudio"

namespace pipewire {

struct PendingPort {
	uint32_t node_id;
	uint32_t port_id;
	std::string channel;
};

struct ActiveLink {
	pw_proxy *link;
	uint32_t node_id;
	uint32_t port_id;
	std::string channel;
};

class PipewireAudio {
   public:
	PipewireAudio();
	~PipewireAudio();

	bool initialize();
	void stop();

	bool start_capture(pid_t exclude_pid, AudioDataCallback callback);
	bool stop_capture(bool preserve_state = true);

	void push_to_output_buffer(AudioFrame *frame);

	void set_audio_format(spa_audio_format format, uint32_t rate, uint32_t channels);
	uint32_t get_format() const { return current_format; }
	uint32_t get_sample_rate() const { return current_rate; }
	uint32_t get_channels() const { return current_channels; }
	size_t get_bytes_per_sample() const;

   private:
	bool create_input_node();
	bool create_output_node();

	void process_input_audio();
	void input_param_changed(uint32_t id, const struct spa_pod *param);
	void input_state_changes(enum pw_stream_state old, enum pw_stream_state state, const char *error);

	void try_link_ports();

	friend void registry_event_global(
		void *app,
		uint32_t id,
		uint32_t permissions,
		const char *type,
		uint32_t version,
		const struct spa_dict *props
	);
	friend void registry_event_global_remove(void *app, uint32_t id);

	// input stream events
	friend void input_process(void *userdata);
	friend void input_param_changed(void *userdata, uint32_t id, const struct spa_pod *param);
	friend void input_state_changes(void *userdata, enum pw_stream_state old, enum pw_stream_state state, const char *error);

	// output stream events
	friend void output_process(void *userdata);
	friend void output_state_changes(void *userdata, enum pw_stream_state old, enum pw_stream_state state, const char *error);

	// capture state
	std::atomic<bool> initialized;
	std::atomic<bool> is_capturing;
	pid_t excluded_pid;
	std::mutex callback_mutex;

	// pipewire objects
	pw_thread_loop *thread_loop;
	pw_loop *loop;

	pw_context *context;
	pw_core *core;
	pw_registry *registry;
	spa_hook registry_listener;

	// capture stream
	pw_stream *capture_stream;
	uint32_t capture_stream_node_id;

	// output stream
	pw_stream *output_stream;
	uint32_t output_stream_node_id;
	ring_buffer::RingBuffer output_buffer{ 1024 * 1024 };

	// router
	std::unordered_map<uint32_t, pid_t> target_nodes;  // node_id -> pid
	std::unordered_map<std::string, uint32_t> stream_ports;
	std::vector<PendingPort> pending_ports;
	std::unordered_map<uint32_t, std::vector<ActiveLink>> active_links;

	// audio format state
	uint32_t current_format;
	uint32_t current_rate;
	uint32_t current_channels;

	// user callback
	AudioDataCallback data_callback;
};

}  // namespace pipewire

#endif	// PIPEWIRE_CAPTURE_IMPL_HPP
