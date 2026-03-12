#include <cstddef>
#include <cstdio>
#include <cstring>
#include <thread>

#include "input.hpp"
#include "main.hpp"
#include "output.hpp"
#include "pipewire/thread-loop.h"
#include "router.hpp"
#include "utils.hpp"

namespace pipewire {
PipewireAudio::PipewireAudio()
	: initialized(false), is_capturing(false), excluded_pid(0), thread_loop(nullptr), loop(nullptr), context(nullptr), core(nullptr), registry(nullptr), capture_stream(nullptr), capture_stream_node_id(0), current_format(SPA_AUDIO_FORMAT_UNKNOWN), current_rate(0), current_channels(0) {
	memset(&registry_listener, 0, sizeof(registry_listener));
}

PipewireAudio::~PipewireAudio() {
	stop();
}

bool PipewireAudio::initialize() {
	if (initialized) {
		return false;
	}

	printf("Initializing sysaudio engine...\n");

	// initialize pipewire
	pw_init(nullptr, nullptr);

	// main_loop = pw_main_loop_new(nullptr);
	// if (!main_loop) {
	// 	fprintf(stderr, "Failed to create PipeWire main loop\n");
	// 	return false;
	// }

	thread_loop = pw_thread_loop_new("sysaudio-engine", nullptr);
	if (!thread_loop) {
		fprintf(stderr, "Failed to create PipeWire thread loop\n");
		return false;
	}

	loop = pw_thread_loop_get_loop(thread_loop);
	if (!loop) {
		fprintf(stderr, "Failed to get PipeWire loop\n");
		stop();
		return false;
	}

	// create context
	context = pw_context_new(loop, nullptr, 0);
	if (!context) {
		fprintf(stderr, "Failed to create PipeWire context\n");
		stop();
		return false;
	}

	// connect core
	core = pw_context_connect(context, nullptr, 0);
	if (!core) {
		fprintf(stderr, "Failed to connect PipeWire context\n");
		stop();
		return false;
	}

	// get registry
	registry = pw_core_get_registry(core, PW_VERSION_REGISTRY, 0);
	if (!registry) {
		fprintf(stderr, "Failed to get PipeWire registry\n");
		stop();
		return false;
	}

	// add registry listener
	pw_registry_add_listener(registry, &registry_listener, &registry_events, this);

	if (!create_output_node()) {
		fprintf(stderr, "Failed to create PipeWire output stream node\n");
		stop();
		return false;
	}

	if (pw_thread_loop_start(thread_loop) < 0) {
		fprintf(stderr, "Failed to start PipeWire thread\n");
		pw_thread_loop_destroy(thread_loop);
		return false;
	}

	std::this_thread::sleep_for(std::chrono::milliseconds(100));

	printf("SysAudio engine initialized\n");

	initialized = true;
	return true;
}

void PipewireAudio::stop() {
	if (thread_loop) {
		pw_thread_loop_lock(thread_loop);
	}

	if (capture_stream) {
		stop_capture(false);
		target_nodes.clear();
		pending_ports.clear();
	}

	if (output_stream) {
		printf("Disconnecting output stream\n");
		pw_stream_disconnect(output_stream);

		printf("Destroying output stream\n");
		pw_stream_destroy(output_stream);

		output_stream = nullptr;
	}

	if (registry) {
		printf("Destroying registry\n");
		spa_hook_remove(&registry_listener);
		pw_proxy_destroy((struct pw_proxy *)registry);
		registry = nullptr;
	}

	if (core) {
		printf("Destroying core\n");
		pw_core_disconnect(core);
		core = nullptr;
	}

	if (context) {
		printf("Destroying context\n");
		pw_context_destroy(context);
		context = nullptr;
	}

	if (data_callback) {
		// clear callback
		{
			std::lock_guard<std::mutex> lock(callback_mutex);
			data_callback = nullptr;
		}
	}

	if (thread_loop) {
		printf("Stopping thread loop\n");
		pw_thread_loop_unlock(thread_loop);
		pw_thread_loop_stop(thread_loop);
		pw_thread_loop_destroy(thread_loop);
		thread_loop = nullptr;
	}

	pw_deinit();
	printf("SysAudio engine stopped\n");
}

size_t PipewireAudio::get_bytes_per_sample() const {
	return utils::get_bytes_per_sample(static_cast<spa_audio_format>(current_format));
}

void PipewireAudio::set_audio_format(spa_audio_format format, uint32_t rate, uint32_t channels) {
	current_format = static_cast<uint32_t>(format);
	current_rate = rate;
	current_channels = channels;
}

}  // namespace pipewire
