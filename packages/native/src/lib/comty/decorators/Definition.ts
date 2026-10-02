import type { AxiosRequestConfig } from "axios"

export function Definition<Args extends any[]>(
	configFn: (...args: Args) => AxiosRequestConfig,
) {
	return function (
		target: undefined,
		context: ClassFieldDecoratorContext<
			any,
			(...args: Args) => Promise<any>
		>,
	) {
		return function (this: any) {
			return async (...args: Args) => {
				const res = await this.request(configFn.call(this, ...args))

				return res.data
			}
		}
	}
}
