export function ReturnResponseData<This, Args extends any[], Return>(
	target: (this: This, ...args: Args) => Return,
) {
	return async function (this: This, ...args: Args): Promise<Return> {
		const res = await target.call(this, ...args)

		return res.data
	}
}
