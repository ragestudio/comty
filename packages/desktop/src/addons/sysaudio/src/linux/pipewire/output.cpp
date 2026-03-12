#include "main.hpp"
#include "output.hpp"

namespace pipewire {
void output_process(void *userdata) {
	PipewireAudio *instance = static_cast<PipewireAudio *>(userdata);
	pw_buffer *buffObj = pw_stream_dequeue_buffer(instance->output_stream);

	if (!buffObj) {
		return;
	}

	spa_data *data = &buffObj->buffer->datas[0];

	uint32_t req_bytes = buffObj->requested ? (buffObj->requested * 4) : data->maxsize;

	if (req_bytes > data->maxsize) {
		req_bytes = data->maxsize;
	}

	size_t bytes_read = instance->output_buffer.read(static_cast<uint8_t *>(data->data), req_bytes);

	if (bytes_read < req_bytes) {
		memset(static_cast<uint8_t *>(data->data) + bytes_read, 0, req_bytes - bytes_read);
	}

	data->chunk->offset = 0;
	data->chunk->size = req_bytes;
	data->chunk->stride = 4;

	pw_stream_queue_buffer(instance->output_stream, buffObj);
}

void output_state_changes(void *userdata, enum pw_stream_state old, enum pw_stream_state state, const char *error) {
	PipewireAudio *instance = static_cast<PipewireAudio *>(userdata);

	printf("Output stream state changed: %s\n", pw_stream_state_as_string(state));

	if (state == PW_STREAM_STATE_STREAMING) {
		// update the stream node id
		instance->output_stream_node_id = pw_stream_get_node_id(instance->output_stream);
	} else if (state != PW_STREAM_STATE_STREAMING) {
		instance->output_stream_node_id = 0;
	}
}

const struct pw_stream_events output_stream_events = {
	.version = PW_VERSION_STREAM_EVENTS,
	.destroy = nullptr,
	.state_changed = output_state_changes,
	.control_info = nullptr,
	.io_changed = nullptr,
	.param_changed = nullptr,
	.add_buffer = nullptr,
	.remove_buffer = nullptr,
	.process = output_process,
	.drained = nullptr,
	.command = nullptr,
	.trigger_done = nullptr,
};

bool PipewireAudio::create_output_node() {
	if (!core) {
		return false;
	}

	printf("Creating output node...\n");

	pw_properties *props = pw_properties_new(
		PW_KEY_MEDIA_TYPE, "Audio",
		PW_KEY_MEDIA_CATEGORY, "Playback",
		PW_KEY_NODE_NAME, INPUT_NODE_NAME,
		PW_KEY_NODE_DESCRIPTION, "System-wide audio output",
		PW_KEY_APP_ID, "comty.desktop",
		PW_KEY_APP_NAME, "Comty",
		PW_KEY_APP_ICON_NAME, "comty",
		PW_KEY_NODE_VIRTUAL, "true",
		PW_KEY_NODE_ALWAYS_PROCESS, "true",
		nullptr
	);

	output_stream = pw_stream_new_simple(
		loop,
		INPUT_NODE_NAME,
		props,
		&output_stream_events,
		this
	);

	if (!output_stream) {
		fprintf(stderr, "Failed to create PipeWire output stream\n");
		return false;
	}

	uint8_t buffer[2048];
	const struct spa_pod *params[1];
	struct spa_pod_builder builder = SPA_POD_BUILDER_INIT(buffer, sizeof(buffer));

	struct spa_audio_info_raw audio_info = SPA_AUDIO_INFO_RAW_INIT(
			.format = SPA_AUDIO_FORMAT_S16_LE,
			.flags = 0,
			.rate = 44100,
			.channels = 2,
			.position = { SPA_AUDIO_CHANNEL_FL, SPA_AUDIO_CHANNEL_FR }
	);

	params[0] = spa_format_audio_raw_build(&builder, SPA_PARAM_EnumFormat, &audio_info);

	pw_stream_flags flags = static_cast<pw_stream_flags>(
		PW_STREAM_FLAG_MAP_BUFFERS |
		PW_STREAM_FLAG_AUTOCONNECT |
		PW_STREAM_FLAG_RT_PROCESS
	);

	int ok = pw_stream_connect(
		output_stream,
		PW_DIRECTION_OUTPUT,
		PW_ID_ANY,
		flags,
		params,
		1
	);

	if (ok != 0) {
		fprintf(stderr, "Failed to connect stream: %d\n", ok);
		return false;
	}

	printf("Output node created & connected\n");

	return true;
}

void PipewireAudio::push_to_output_buffer(AudioFrame *frame) {
	output_buffer.write(frame->buff, frame->size);
}

}  // namespace pipewire
