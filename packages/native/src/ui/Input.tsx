import { Input, styled } from "tamagui"

export const AppInput = styled(Input, {
	color: "$textColor",
	border: "2px solid $borderColor",
	placeholderTextColor: "$borderColor",
	flex: 1,

	variants: {
		type: {
			default: {},
		},
	} as const,

	defaultVariants: {
		type: "default",
	},
})

export default AppInput
