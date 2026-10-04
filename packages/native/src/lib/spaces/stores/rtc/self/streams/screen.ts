import BaseStream from "./base"

export const ScreenStream = () =>
	new BaseStream({
		async onStart(params) {
			return null
		},
	})

export default ScreenStream
