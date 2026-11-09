declare module "radix-router" {
	interface RadixRoute {
		path: string
		params?: Record<string, string>
	}

	class RadixRouter {
		constructor(options?: { strict?: boolean; routes?: RadixRoute[] })

		insert<T extends { path: string }>(route: T): unknown
		lookup(path: string): RadixRoute | null
		startsWith(prefix: string): RadixRoute[]
		remove(path: string): boolean
	}

	export = RadixRouter
}
