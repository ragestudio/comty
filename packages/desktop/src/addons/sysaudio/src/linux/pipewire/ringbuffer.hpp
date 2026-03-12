#include <atomic>
#include <cstdint>
#include <cstring>
#include <vector>

namespace pipewire::ring_buffer {

class RingBuffer {
   public:
	RingBuffer(size_t capacity) {
		size_t power_of_two = 1;

		while (power_of_two < capacity) {
			power_of_two *= 2;
		}

		buffer.resize(power_of_two, 0);
		mask = power_of_two - 1;
	}

	size_t write(const uint8_t *data, size_t size) {
		size_t current_tail = tail.load(std::memory_order_relaxed);
		size_t current_head = head.load(std::memory_order_acquire);

		size_t available = buffer.size() - (current_tail - current_head);

		if (size > available) {
			size = available;
		}

		for (size_t i = 0; i < size; ++i) {
			buffer[(current_tail + i) & mask] = data[i];
		}

		tail.store(current_tail + size, std::memory_order_release);
		return size;
	}

	size_t read(uint8_t *out_data, size_t size) {
		size_t current_head = head.load(std::memory_order_relaxed);
		size_t current_tail = tail.load(std::memory_order_acquire);

		size_t available = current_tail - current_head;

		if (size > available) {
			size = available;
		}

		for (size_t i = 0; i < size; ++i) {
			out_data[i] = buffer[(current_head + i) & mask];
		}

		head.store(current_head + size, std::memory_order_release);
		return size;
	}

   private:
	std::vector<uint8_t> buffer;
	size_t mask;
	alignas(64) std::atomic<size_t> head{ 0 };
	alignas(64) std::atomic<size_t> tail{ 0 };
};

}  // namespace pipewire::ring_buffer
