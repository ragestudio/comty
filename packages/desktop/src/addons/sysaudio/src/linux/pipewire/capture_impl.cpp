#include <iostream>
#include <thread>

#include "audio_utils.hpp"
#include "capture_impl.hpp"

namespace pipewire {

CaptureImpl::CaptureImpl()
	: is_capturing(false), excluded_pid(0), loop(nullptr), context(nullptr), core(nullptr), stream(nullptr), current_format(SPA_AUDIO_FORMAT_UNKNOWN), current_rate(0), current_channels(0) {
	memset(&stream_listener, 0, sizeof(stream_listener));
}

CaptureImpl::~CaptureImpl() {
	stop();
}

void CaptureImpl::send_mock_data() {
	// if (!data_callback) {
	// 	return;
	// }

	// AudioFormat format{};
	// format.sampleRate = 0;
	// format.channels = 0;
	// format.bitsPerSample = 0;
	// format.format = SPA_AUDIO_FORMAT_UNKNOWN;

	// data_callback(nullptr, 0, format);
}

bool CaptureImpl::start(pid_t exclude_pid, AudioDataCallback callback) {
	if (is_capturing) {
		return false;
	}

	excluded_pid = exclude_pid;
	data_callback = callback;

	std::cout << "Starting SysAudio capture | excluded_pid: " << excluded_pid << std::endl;

	// initialize pipewire
	pw_init(nullptr, nullptr);

	loop = pw_loop_new(nullptr);
	if (!loop) {
		std::cerr << "Failed to create PipeWire loop" << std::endl;
		return false;
	}

	context = pw_context_new(loop, nullptr, 0);
	if (!context) {
		std::cerr << "Failed to create PipeWire context" << std::endl;
		cleanup();
		return false;
	}

	core = pw_context_connect(context, nullptr, 0);
	if (!core) {
		std::cerr << "Failed to connect PipeWire context" << std::endl;
		cleanup();
		return false;
	}

	if (!create_input_node()) {
		std::cerr << "Failed to create PipeWire input stream node" << std::endl;
		cleanup();
		return false;
	}

	// start the loop in a separate thread
	capture_thread = std::thread([this]() {
		while (is_capturing) {
			int ret = pw_loop_iterate(loop, 100);

			if (ret < 0) {
				std::cerr << "PipeWire loop iteration failed: " << ret << std::endl;
				break;
			}
		}
	});

	is_capturing = true;

	return true;
}

void CaptureImpl::stop() {
	std::cout << "Stopping SysAudio capture" << std::endl;

	// stop the capture thread first
	is_capturing = false;

	if (capture_thread.joinable()) {
		capture_thread.join();
	}

	cleanup();
	pw_deinit();

	data_callback = nullptr;
	excluded_pid = 0;
}

void on_process(void *userdata) {
	CaptureImpl *capture = static_cast<CaptureImpl *>(userdata);

	capture->process_audio();
}

void on_param_changed(void *userdata, uint32_t id, const struct spa_pod *param) {
	CaptureImpl *capture = static_cast<CaptureImpl *>(userdata);
	capture->handle_param_change(id, param);
}

void on_state_changed(void *userdata, enum pw_stream_state old, enum pw_stream_state state, const char *error) {
	CaptureImpl *capture = static_cast<CaptureImpl *>(userdata);
	capture->handle_state_change(old, state, error);
}

static const struct pw_stream_events stream_events = {
	.version = PW_VERSION_STREAM_EVENTS,
	.destroy = nullptr,
	.state_changed = on_state_changed,
	.control_info = nullptr,
	.io_changed = nullptr,
	.param_changed = on_param_changed,
	.add_buffer = nullptr,
	.remove_buffer = nullptr,
	.process = on_process,
	.drained = nullptr,
	.command = nullptr,
	.trigger_done = nullptr,
};

void CaptureImpl::process_audio() {
	pw_buffer *buf = pw_stream_dequeue_buffer(stream);

	if (!buf) {
		std::cerr << "Warning: out of buffers" << std::endl;
		return;
	}

	spa_buffer *spa_buf = buf->buffer;
	spa_data *data = &spa_buf->datas[0];

	if (data->data == nullptr || data->chunk == nullptr || !data_callback) {
		pw_stream_queue_buffer(stream, buf);
		return;
	}

	size_t bytes = data->chunk->size;
	if (bytes == 0) {
		pw_stream_queue_buffer(stream, buf);
		return;
	}

	// create audio format info
	AudioFormat *format = new AudioFormat;
	format->sampleRate = current_rate;
	format->channels = current_channels;
	format->bitsPerSample = audio::get_bytes_per_sample(static_cast<spa_audio_format>(current_format)) * 8;
	format->format = current_format;

	// validate buffer
	// if (!audio::validate_buffer_size(bytes, *format)) {
	// 	pw_stream_queue_buffer(stream, buf);
	// 	delete format;
	// 	return;
	// }

	AudioFrame *frame = new AudioFrame{
		static_cast<uint8_t *>(data->data),
		format,
		bytes
	};

	// // debug logging
	// static size_t frame_count = 0;
	// frame_count++;
	// audio::log_audio_buffer(data->data, bytes, format, frame_count);

	// call callback with raw audio data
	data_callback(frame);

	pw_stream_queue_buffer(stream, buf);
}

void CaptureImpl::handle_param_change(uint32_t id, const struct spa_pod *param) {
	if (param == nullptr || id != SPA_PARAM_Format) {
		return;
	}

	spa_audio_info_raw info = {};
	spa_zero(info);

	if (spa_format_audio_raw_parse(param, &info) < 0) {
		std::cerr << "Failed to parse audio format" << std::endl;
		return;
	}

	current_format = static_cast<uint32_t>(info.format);
	current_rate = info.rate;
	current_channels = info.channels;
}

void CaptureImpl::handle_state_change(enum pw_stream_state old, enum pw_stream_state state, const char *error) {
	std::cout << "Stream state changed: " << pw_stream_state_as_string(state) << std::endl;

	if (error) {
		std::cerr << "Stream error: " << error << std::endl;
	}
}

bool CaptureImpl::create_input_node() {
	if (!core) {
		return false;
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

	stream = pw_stream_new(core, INPUT_NODE_NAME, props);

	if (!stream) {
		std::cerr << "Failed to create PipeWire stream" << std::endl;
		return false;
	}

	uint8_t buffer[2048];

	const struct spa_pod *params[5];
	struct spa_pod_builder builder = SPA_POD_BUILDER_INIT(buffer, sizeof(buffer));

	int param_count = 0;

	// preferred format: S16LE, 44100Hz, stereo
	struct spa_audio_info_raw audio_info = SPA_AUDIO_INFO_RAW_INIT(
			.format = SPA_AUDIO_FORMAT_S16_LE,
			.rate = 44100,
			.channels = 2
	);
	audio_info.position[0] = SPA_AUDIO_CHANNEL_FL;
	audio_info.position[1] = SPA_AUDIO_CHANNEL_FR;
	params[param_count++] = spa_format_audio_raw_build(&builder, SPA_PARAM_EnumFormat, &audio_info);

	// alternative: S16LE, 48000Hz, stereo
	audio_info = SPA_AUDIO_INFO_RAW_INIT(
			.format = SPA_AUDIO_FORMAT_S16_LE,
			.rate = 48000,
			.channels = 2
	);
	audio_info.position[0] = SPA_AUDIO_CHANNEL_FL;
	audio_info.position[1] = SPA_AUDIO_CHANNEL_FR;
	params[param_count++] = spa_format_audio_raw_build(&builder, SPA_PARAM_EnumFormat, &audio_info);

	// alternative: F32LE, 44100Hz, stereo
	audio_info = SPA_AUDIO_INFO_RAW_INIT(
			.format = SPA_AUDIO_FORMAT_F32_LE,
			.rate = 44100,
			.channels = 2
	);
	audio_info.position[0] = SPA_AUDIO_CHANNEL_FL;
	audio_info.position[1] = SPA_AUDIO_CHANNEL_FR;
	params[param_count++] = spa_format_audio_raw_build(&builder, SPA_PARAM_EnumFormat, &audio_info);

	// alternative: F32LE, 48000Hz, stereo
	audio_info = SPA_AUDIO_INFO_RAW_INIT(
			.format = SPA_AUDIO_FORMAT_F32_LE,
			.rate = 48000,
			.channels = 2
	);
	audio_info.position[0] = SPA_AUDIO_CHANNEL_FL;
	audio_info.position[1] = SPA_AUDIO_CHANNEL_FR;
	params[param_count++] = spa_format_audio_raw_build(&builder, SPA_PARAM_EnumFormat, &audio_info);

	// alternative: S16LE, 44100Hz, mono (for compatibility)
	audio_info = SPA_AUDIO_INFO_RAW_INIT(
			.format = SPA_AUDIO_FORMAT_S16_LE,
			.rate = 44100,
			.channels = 1
	);
	audio_info.position[0] = SPA_AUDIO_CHANNEL_MONO;
	params[param_count++] = spa_format_audio_raw_build(&builder, SPA_PARAM_EnumFormat, &audio_info);

	// configure stream callbacks
	pw_stream_add_listener(stream, &stream_listener, &stream_events, this);

	// connect the stream
	pw_stream_flags flags = static_cast<pw_stream_flags>(
		PW_STREAM_FLAG_AUTOCONNECT | PW_STREAM_FLAG_MAP_BUFFERS
	);

	int stream_connect = pw_stream_connect(
		stream,
		PW_DIRECTION_INPUT,
		PW_ID_ANY,
		flags,
		params,
		param_count
	);

	if (stream_connect != 0) {
		std::cerr << "Failed to connect stream: " << stream_connect << std::endl;
		return false;
	}

	std::cout << "PipeWire input node created successfully" << std::endl;

	// give pipewire time to register the node
	std::this_thread::sleep_for(std::chrono::milliseconds(100));

	return true;
}

void CaptureImpl::cleanup() {
	if (stream) {
		pw_stream_disconnect(stream);
		pw_stream_destroy(stream);
		stream = nullptr;
		memset(&stream_listener, 0, sizeof(stream_listener));
	}

	if (core) {
		pw_core_disconnect(core);
		core = nullptr;
	}

	if (context) {
		pw_context_destroy(context);
		context = nullptr;
	}

	if (loop) {
		pw_loop_destroy(loop);
		loop = nullptr;
	}
}

}  // namespace pipewire
