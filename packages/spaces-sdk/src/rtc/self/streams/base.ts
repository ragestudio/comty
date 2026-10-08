import type { Self, StreamsKinds } from ".."

export interface InternalMediaStream extends MediaStream {
	release?: (releaseTracks?: boolean) => void
}

export interface BaseHandlerParams {
	start: { force?: boolean }
	close: { force?: boolean }
}

export interface StreamHandlers<
	T extends BaseHandlerParams = BaseHandlerParams,
> {
	onStart?: (
		this: BaseStream<T>,
		params?: T["start"],
	) => Promise<InternalMediaStream | null>
	onClose?: (this: BaseStream<T>, params?: T["close"]) => Promise<void>
}

export class BaseStream<
	HandlersParams extends BaseHandlerParams = BaseHandlerParams,
> {
	constructor(
		public readonly self: Self,
		public readonly kind: keyof typeof StreamsKinds,
		private handlers?: StreamHandlers<HandlersParams>,
	) {}

	stream: InternalMediaStream | null = null

	async start(params?: HandlersParams["start"]) {
		return await this.handlers?.onStart?.call(this, params)
	}

	async close(params?: HandlersParams["close"]) {
		return await this.handlers?.onClose?.call(this, params)
	}
}

export default BaseStream
