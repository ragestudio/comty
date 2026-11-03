import "@comty/shared/utils/index"

declare module "*.svg" {
	const content: any
	export default content
}

export {}
