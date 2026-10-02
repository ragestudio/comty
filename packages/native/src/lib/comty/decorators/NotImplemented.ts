export function NotImplemented<This, Args extends any[], Return>(
	target: (this: This, ...args: Args) => Return,
) {
	return async function (this: This, ...args: Args): Promise<Return> {
		throw new Error("Not implemented")
	}
}
