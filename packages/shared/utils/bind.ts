export function Bind<T extends Function>(
	thisArg: any,
	fn: T,
): OmitThisParameter<T> {
	return fn.bind(thisArg)
}

export default Bind
