import MediaRTC from "../mediartc.core"

interface RecoverySnapshot {
	channelId: string
	groupId: string
	isDm: boolean
	isMuted: boolean
	isDeafened: boolean
	wasProducingCamera: boolean
	wasProducingScreen: boolean
	screenStreamAlive: boolean
}

const MAX_RETRIES_PER_CYCLE = 5
const BASE_DELAY_MS = 1000
const MAX_DELAY_MS = 15000

export default class AutoRecovery {
	core: MediaRTC

	retryCount = 0
	retryTimer: ReturnType<typeof setTimeout> | null = null

	snapshot: RecoverySnapshot | null = null
	active = false

	constructor(core: MediaRTC) {
		this.core = core
	}

	get isRecovering() {
		return this.active
	}

	private computeDelay(): number {
		const delay = BASE_DELAY_MS * Math.pow(2, this.retryCount)
		return Math.min(delay, MAX_DELAY_MS)
	}

	takeSnapshot(): RecoverySnapshot | null {
		if (!this.core.state.isJoined || !this.core.state.channelId) {
			return null
		}

		this.snapshot = {
			channelId: this.core.state.channelId,
			groupId: this.core._joinedGroupId || null,
			isDm: this.core.state.isDm ?? false,
			isMuted: this.core.state.isMuted ?? false,
			isDeafened: this.core.state.isDeafened ?? false,
			wasProducingCamera: this.core.state.isProducingCamera ?? false,
			wasProducingScreen: this.core.state.isProducingScreen ?? false,
			screenStreamAlive:
				!!this.core.self.screenStream &&
				this.core.self.screenStream.getTracks().length > 0,
		}

		return this.snapshot
	}

	async start(): Promise<boolean> {
		if (!this.snapshot || !this.snapshot.groupId) {
			this.core.console.warn(
				"[auto-recovery] No snapshot to recover from",
			)
			return false
		}

		if (this.active) {
			this.core.console.debug("[auto-recovery] Already in progress")
			return false
		}

		this.active = true
		this.retryCount = 0

		this.core.state.isReconnecting = true

		this.core.console.log(
			"[auto-recovery] Starting recovery process",
			this.snapshot,
		)

		return await this.attemptRecovery()
	}

	private async attemptRecovery(): Promise<boolean> {
		const snapshot = this.snapshot!
		const { channelId, groupId } = snapshot

		while (this.retryCount < MAX_RETRIES_PER_CYCLE) {
			try {
				this.core.console.debug(
					`[auto-recovery] Attempt ${this.retryCount + 1}/${MAX_RETRIES_PER_CYCLE}`,
				)

				// rejoin the channel (will throw if socket is not connected)
				await this.core.handlers.joinChannel(groupId, channelId)

				// restore mute/deafen state
				if (snapshot.isMuted && !this.core.state.isMuted) {
					await this.core.handlers.toggleMute(true)
				}

				if (snapshot.isDeafened && !this.core.state.isDeafened) {
					await this.core.handlers.toggleDeafen(true)
				}

				// restore camera if it was active
				if (snapshot.wasProducingCamera) {
					try {
						await this.core.handlers.startCameraShare()
					} catch (err) {
						this.core.console.warn(
							"[auto-recovery] Failed to restore camera",
							err,
						)
					}
				}

				// restore screen share if it was active and stream is still alive
				if (snapshot.wasProducingScreen && snapshot.screenStreamAlive) {
					try {
						await this.core.handlers.startScreenShare()
					} catch (err) {
						this.core.console.warn(
							"[auto-recovery] Failed to restore screen share",
							err,
						)
					}
				}

				this.core.console.log("[auto-recovery] Recovery successful")

				this._onSuccess()
				return true
			} catch (error) {
				this.retryCount++

				this.core.console.warn(
					`[auto-recovery] Attempt ${this.retryCount} failed:`,
					error?.message || error,
				)

				if (this.retryCount >= MAX_RETRIES_PER_CYCLE) {
					this.core.console.warn(
						"[auto-recovery] Max retries for this cycle, waiting for next WS reconnect",
					)
					break
				}

				const delay = this.computeDelay()
				this.core.console.debug(
					`[auto-recovery] Retrying in ${delay}ms`,
				)

				await new Promise((resolve) => setTimeout(resolve, delay))
			}
		}

		// keep snapshot and isReconnecting for next WS reconnect trigger
		this.active = false
		this.retryCount = 0

		return false
	}

	private _onSuccess() {
		this.core.state.isReconnecting = false
		this.active = false
		this.retryCount = 0
		this.snapshot = null
	}

	cancel() {
		if (this.retryTimer) {
			clearTimeout(this.retryTimer)
			this.retryTimer = null
		}

		this.core.state.isReconnecting = false
		this.active = false
		this.retryCount = 0
		this.snapshot = null

		this.core.console.log("[auto-recovery] Recovery cancelled")
	}
}
