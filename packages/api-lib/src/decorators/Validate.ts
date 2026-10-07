import * as v from "valibot"

export function Validate(...schemas: any[]) {
	return function (
		target: undefined,
		context: ClassFieldDecoratorContext<
			any,
			(...args: any[]) => Promise<any>
		>,
	) {
		return function (this: any, initialValue: any) {
			return async (...args: any[]) => {
				const parsedArgs = args.map((arg, i) => {
					if (schemas[i]) {
						return v.parse(schemas[i], arg)
					}
					return arg
				})

				if (typeof initialValue !== "function") {
					throw new Error(
						"Validate decorator must be placed ABOVE @Endpoint",
					)
				}

				return initialValue.apply(this, parsedArgs)
			}
		}
	}
}

export default Validate
