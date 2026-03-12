#ifndef PIPEWIRE_ROUTER_HPP
#define PIPEWIRE_ROUTER_HPP

#include <pipewire/pipewire.h>

namespace pipewire {

class PipewireAudio;

void registry_event_global(
	void *app,
	uint32_t id,
	uint32_t permissions,
	const char *type,
	uint32_t version,
	const struct spa_dict *props
);

void registry_event_global_remove(void *app, uint32_t id);

extern const struct pw_registry_events registry_events;

}  // namespace pipewire

#endif	// PIPEWIRE_ROUTER_HPP
