#include "capture.hpp"
#include "pipewire/capture_impl.hpp"

Capture::Capture() : impl(std::make_unique<pipewire::CaptureImpl>()) {}

Capture::~Capture() = default;

bool Capture::Start(pid_t excludePid, AudioDataCallback dataCallback) {
	return impl->start(excludePid, dataCallback);
}

void Capture::Stop() {
	impl->stop();
}

void Capture::SendMockData() {
	impl->send_mock_data();
}

spa_audio_format Capture::GetFormat() const {
	return static_cast<spa_audio_format>(impl->get_format());
}

uint32_t Capture::GetSampleRate() const {
	return impl->get_sample_rate();
}

uint32_t Capture::GetChannels() const {
	return impl->get_channels();
}

size_t Capture::GetBytesPerSample() const {
	return impl->get_bytes_per_sample();
}

AudioFormat Capture::GetCurrentFormat() const {
	AudioFormat format;
	format.sampleRate = GetSampleRate();
	format.channels = GetChannels();
	format.bitsPerSample = GetBytesPerSample() * 8;
	format.format = GetFormat();
	return format;
}
