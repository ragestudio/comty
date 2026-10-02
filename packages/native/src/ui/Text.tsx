import { Text, styled } from "tamagui"

export const AppText = styled(Text, {
	fontFamily: "$body",

	variants: {
		type: {
			small: { fontSize: 12 },
			default: { fontSize: 16 },
			big: { fontSize: 18 },
			h1: { fontSize: 24 },
			heading: {
				fontSize: 42,
				fontFamily: "$silk",
			},
			mono: {
				fontFamily: "$mono",
			},
		},
	} as const,

	defaultVariants: {
		type: "default",
	},
})

export default AppText
