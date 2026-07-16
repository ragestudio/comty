export default async (core, data) => {
	core.console.debug("disconnected from channel:", data)

	// if we are intentionally switching channels, dont trigger recovery
	if (core._switchingToChannelId) {
		core.console.debug(
			"[auto-recovery] Intentional channel switch detected, skipping recovery",
		)
		core.handlers.leaveChannel()
		return
	}

	// take a snapshot before cleaning up for potential recovery
	const snapshot = core.autoRecovery.takeSnapshot()

	if (!snapshot) {
		core.console.debug(
			"[auto-recovery] No snapshot to recover, leaving normally",
		)
		core.handlers.leaveChannel()
		return
	}

	// clean up local resources but keep snapshot for recovery
	await core.consumers.stopAll()
	await core.clients.destroyAll()

	// stop self producers but keep media streams alive
	// attachChannel will recreate producers from the streams
	if (core.self.micProducer && !core.self.micProducer.closed) {
		core.self.micProducer.close()
	}
	if (core.self.screenProducer && !core.self.screenProducer.closed) {
		core.self.screenProducer.close()
	}
	if (
		core.self.screenAudioProducer &&
		!core.self.screenAudioProducer.closed
	) {
		core.self.screenAudioProducer.close()
	}
	if (core.self.camProducer && !core.self.camProducer.closed) {
		core.self.camProducer.close()
	}

	if (core.sendTransport && !core.sendTransport.closed) {
		core.sendTransport.close()
	}
	if (core.recvTransport && !core.recvTransport.closed) {
		core.recvTransport.close()
	}

	core.producers.clear()
	core.device = null

	core.state.isJoined = false
	core.state.isLoading = false
	core.state.recvTransportState = "closed"
	core.state.sendTransportState = "closed"

	core.console.log(
		"[auto-recovery] Snapshot saved, waiting for WS reconnection",
	)

	// try recovery in case WS is still connected
	core.autoRecovery.start()
}
