import type { Self } from ".."

export interface SelfMediaHandlersParams {
	create?: {}
	destroy?: {}
}

export interface SelfMediaHandlers<
	T extends SelfMediaHandlersParams = SelfMediaHandlersParams,
> {
	onCreate?: (this: SelfMedia<T>, params?: T["create"]) => Promise<any>
	onDestroy?: (this: SelfMedia<T>, params?: T["destroy"]) => Promise<any>
}

export class SelfMedia<
	T extends SelfMediaHandlersParams = SelfMediaHandlersParams,
> {
	constructor(
		public readonly self: Self,
		private handlers?: SelfMediaHandlers<T>,
	) {}

	async create(params?: T["create"]) {
		return await this.handlers?.onCreate?.call(this, params)
	}

	async destroy(params?: T["destroy"]) {
		return await this.handlers?.onDestroy?.call(this, params)
	}
}
