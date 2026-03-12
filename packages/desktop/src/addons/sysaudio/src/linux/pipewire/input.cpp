#include <algorithm>
#include <cstdio>

#include "input.hpp"
#include "main.hpp"
#include "pipewire/thread-loop.h"
#include "utils.hpp"

namespace pipewire {
void input_process(void *userdata) {
	PipewireAudio *instance = static_cast<PipewireAudio *>(userdata);
	instance->process_input_audio();
}

void input_param_changed(void *userdata, uint32_t id, const struct spa_pod *param) {
	PipewireAudio *instance = static_cast<PipewireAudio *>(userdata);
	instance->input_param_changed(id, param);
}

void input_state_changes(void *userdata, enum pw_stream_state old, enum pw_stream_state state, const char *error) {
	PipewireAudio *instance = static_cast<PipewireAudio *>(userdata);
	instance->input_state_changes(old, state, error);
}

static const struct pw_stream_events input_stream_events = {
	.version = PW_VERSION_STREAM_EVENTS,
	.destroy = nullptr,
	.state_changed = input_state_changes,
	.control_info = nullptr,
	.io_changed = nullptr,
	.param_changed = input_param_changed,
	.add_buffer = nullptr,
	.remove_buffer = nullptr,
	.process = input_process,
	.drained = nullptr,
	.command = nullptr,
	.trigger_done = nullptr,
};

bool PipewireAudio::create_input_node() {
	if (!core) {
		return false;
	}
	printf("Creating input node...\n");

	if (thread_loop) {
		pw_thread_loop_lock(thread_loop);
	}

	// create properties for the stream
	pw_properties *props = pw_properties_new(
		PW_KEY_MEDIA_TYPE, "Audio",
		PW_KEY_MEDIA_CATEGORY, "Capture",
		PW_KEY_MEDIA_ROLE, "Music",
		PW_KEY_NODE_NAME, INPUT_NODE_NAME,
		PW_KEY_NODE_DESCRIPTION, "System-wide audio capture",
		PW_KEY_APP_ID, "comty.desktop",
		PW_KEY_APP_NAME, "Comty",
		PW_KEY_APP_ICON_NAME, "comty",
		PW_KEY_NODE_VIRTUAL, "true",
		PW_KEY_NODE_ALWAYS_PROCESS, "true",
		nullptr
	);

	capture_stream = pw_stream_new_simple(
		loop,
		INPUT_NODE_NAME,
		props,
		&input_stream_events,
		this
	);

	if (!capture_stream) {
		return false;
	}

	uint8_t buffer[2048];

	const struct spa_pod *params[5];
	struct spa_pod_builder builder = SPA_POD_BUILDER_INIT(buffer, sizeof(buffer));

	int param_count = 0;

	// preferred format: S16LE, 44100Hz, stereo
	struct spa_audio_info_raw audio_info = SPA_AUDIO_INFO_RAW_INIT(
			.format = SPA_AUDIO_FORMAT_S16_LE,
			.flags = 0,
			.rate = 44100,
			.channels = 2,
			.position = { SPA_AUDIO_CHANNEL_FL, SPA_AUDIO_CHANNEL_FR }
	);
	params[param_count++] = spa_format_audio_raw_build(&builder, SPA_PARAM_EnumFormat, &audio_info);

	// alternative: S16LE, 48000Hz, stereo
	audio_info = SPA_AUDIO_INFO_RAW_INIT(
			.format = SPA_AUDIO_FORMAT_S16_LE,
			.flags = 0,
			.rate = 48000,
			.channels = 2,
			.position = { SPA_AUDIO_CHANNEL_FL, SPA_AUDIO_CHANNEL_FR }
	);
	params[param_count++] = spa_format_audio_raw_build(&builder, SPA_PARAM_EnumFormat, &audio_info);

	// alternative: F32LE, 44100Hz, stereo
	audio_info = SPA_AUDIO_INFO_RAW_INIT(
			.format = SPA_AUDIO_FORMAT_F32_LE,
			.flags = 0,
			.rate = 44100,
			.channels = 2,
			.position = { SPA_AUDIO_CHANNEL_FL, SPA_AUDIO_CHANNEL_FR }
	);
	params[param_count++] = spa_format_audio_raw_build(&builder, SPA_PARAM_EnumFormat, &audio_info);

	// alternative: F32LE, 48000Hz, stereo
	audio_info = SPA_AUDIO_INFO_RAW_INIT(
			.format = SPA_AUDIO_FORMAT_F32_LE,
			.flags = 0,
			.rate = 48000,
			.channels = 2,
			.position = { SPA_AUDIO_CHANNEL_FL, SPA_AUDIO_CHANNEL_FR }
	);
	params[param_count++] = spa_format_audio_raw_build(&builder, SPA_PARAM_EnumFormat, &audio_info);

	// alternative: S16LE, 44100Hz, mono (for compatibility)
	audio_info = SPA_AUDIO_INFO_RAW_INIT(
			.format = SPA_AUDIO_FORMAT_S16_LE,
			.flags = 0,
			.rate = 44100,
			.channels = 1,
			.position = { SPA_AUDIO_CHANNEL_MONO }
	);
	params[param_count++] = spa_format_audio_raw_build(&builder, SPA_PARAM_EnumFormat, &audio_info);

	// connect the stream
	pw_stream_flags flags = static_cast<pw_stream_flags>(
		PW_STREAM_FLAG_MAP_BUFFERS
	);

	int stream_connect = pw_stream_connect(
		capture_stream,
		PW_DIRECTION_INPUT,
		PW_ID_ANY,
		flags,
		params,
		param_count
	);

	if (stream_connect != 0) {
		fprintf(stderr, "Failed to connect stream: %d\n", stream_connect);
		return false;
	}

	if (thread_loop) {
		pw_thread_loop_unlock(thread_loop);
	}

	printf("Input node created & connected\n");
	return true;
}

bool PipewireAudio::start_capture(pid_t exclude_pid, AudioDataCallback callback) {
	if (is_capturing) {
		return false;
	}

	excluded_pid = exclude_pid;
	data_callback = callback;

	// filter target_nodes by excluded_pid
	for (auto it = target_nodes.begin(); it != target_nodes.end();) {
		if (utils::is_pid_descendant_of(it->second, excluded_pid)) {
			// remove node from target_nodes
			uint32_t node_id = it->first;
			it = target_nodes.erase(it);

			// remove any pending ports for this node
			pending_ports.erase(
				std::remove_if(pending_ports.begin(), pending_ports.end(), [node_id](const PendingPort &p) { return p.node_id == node_id; }),
				pending_ports.end()
			);
		} else {
			++it;
		}
	}

	// create input stream
	if (!create_input_node()) {
		fprintf(stderr, "Failed to create PipeWire input stream node\n");
		return false;
	}

	is_capturing = true;
	return true;
}

bool PipewireAudio::stop_capture(bool preserve_state) {
	printf("stop_capture::start\n");

	if (thread_loop) {
		pw_thread_loop_lock(thread_loop);
	}

	is_capturing = false;
	excluded_pid = 0;

	// destroy active links
	for (auto &[node_id, links] : active_links) {
		for (auto &active_link : links) {
			pw_proxy_destroy(active_link.link);
		}
	}

	if (preserve_state) {
		// move active links info to pending_ports for reuse
		for (auto &[node_id, links] : active_links) {
			for (auto &active_link : links) {
				pending_ports.push_back({ active_link.node_id, active_link.port_id, active_link.channel });
			}
		}
	} else {
		// clear target_nodes when not preserving state
		target_nodes.clear();
	}

	// always clear active_links and stream_ports
	active_links.clear();
	stream_ports.clear();

	{
		std::lock_guard<std::mutex> lock(callback_mutex);
		data_callback = nullptr;
	}

	if (capture_stream) {
		printf("Disconnecting input stream\n");
		pw_stream_disconnect(capture_stream);

		printf("Destroying input stream\n");
		pw_stream_destroy(capture_stream);

		capture_stream = nullptr;
	}

	if (thread_loop) {
		pw_thread_loop_unlock(thread_loop);
	}

	printf("stop_capture::ok\n");
	return true;
}

void PipewireAudio::process_input_audio() {
	if (!is_capturing || !capture_stream) {
		return;
	}

	AudioDataCallback local_callback;
	{
		std::lock_guard<std::mutex> lock(callback_mutex);

		if (!data_callback) {
			return;
		}

		local_callback = data_callback;
	}

	pw_buffer *buf = pw_stream_dequeue_buffer(capture_stream);

	if (!buf) {
		return;
	}

	spa_buffer *spa_buf = buf->buffer;
	spa_data *data = &spa_buf->datas[0];

	if (data->data == nullptr || data->chunk == nullptr) {
		pw_stream_queue_buffer(capture_stream, buf);
		return;
	}

	size_t bytes = data->chunk->size;
	if (bytes == 0) {
		pw_stream_queue_buffer(capture_stream, buf);
		return;
	}

	AudioFormat *format = new AudioFormat;
	format->sampleRate = current_rate;
	format->channels = current_channels;
	format->bitsPerSample = utils::get_bytes_per_sample(static_cast<spa_audio_format>(current_format)) * 8;
	format->format = current_format;

	uint8_t *audio_data = new uint8_t[bytes];
	memcpy(audio_data, data->data, bytes);

	AudioFrame *frame = new AudioFrame{
		audio_data,
		format,
		bytes
	};

	local_callback(frame);

	pw_stream_queue_buffer(capture_stream, buf);
}

void PipewireAudio::input_param_changed(uint32_t id, const struct spa_pod *param) {
	if (param == nullptr || id != SPA_PARAM_Format) {
		return;
	}

	spa_audio_info_raw info = {};
	spa_zero(info);

	if (spa_format_audio_raw_parse(param, &info) < 0) {
		fprintf(stderr, "Failed to parse audio format\n");
		return;
	}

	current_format = static_cast<uint32_t>(info.format);
	current_rate = info.rate;
	current_channels = info.channels;
}

void PipewireAudio::input_state_changes(enum pw_stream_state /*old*/, enum pw_stream_state state, const char *error) {
	printf("Input stream state changed: %s\n", pw_stream_state_as_string(state));

	if (error) {
		printf("Stream error: %s\n", error);
	}

	if (state == PW_STREAM_STATE_STREAMING) {
		// update the stream node id
		capture_stream_node_id = pw_stream_get_node_id(capture_stream);
	} else if (state != PW_STREAM_STATE_STREAMING) {
		capture_stream_node_id = 0;
	}
}
}  // namespace pipewire
