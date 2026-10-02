import type { GetProps } from "tamagui"

import { Button, Spinner, styled } from "tamagui"
import TexturedBackground from "./TextureBg"

export const ButtonStylized = styled(Button, {
	border: "none",
	outline: "none",
	background: "transparent",
	backgroundColor: "transparent",
	borderRadius: 0,
	color: "$textColor",
	height: "fit-content",

	gap: "$3",
	margin: 0,

	paddingVertical: 13,
	paddingHorizontal: 13,

	justifyContent: "center",
	alignItems: "center",

	fontWeight: "normal",
	fontSize: 14,
	textProps: {
		lineHeight: 18,
		padding: 0,
		margin: 0,
	},

	variants: {
		type: {
			default: {
				//outline: "2px solid $borderColor",
			},
			primary: {
				color: "$textColorContrast",
			},
		},

		size: {
			small: { padding: "$2", fontSize: 12 },
			big: { padding: "$4", fontSize: 18 },
		},
	} as const,

	disabledStyle: {
		opacity: 0.7,
	},
	hoverStyle: {
		filter: "brightness(1.2)",
	},
	pressStyle: {
		opacity: 0.8,
		scale: 0.98,
	},

	defaultVariants: {
		type: "default",
	},
})

type AppButton = {
	loading?: boolean
} & GetProps<typeof ButtonStylized>

const AppButton = ({ children, loading, ...rest }: AppButton) => {
	return (
		<ButtonStylized
			{...rest}
			backgroundColor="transparent"
		>
			<TexturedBackground
				borderRadius={12}
				borderWidth={1}
				overlayColor={
					rest.type === "primary" ? "$productColorAccent" : "$bgAccent"
				}
			/>
			{loading && (
				<Spinner
					size="small"
					color={rest.type === "primary" ? "$textColorContrast" : "$textColor"}
				/>
			)}
			{children}
		</ButtonStylized>
	)
}

export default AppButton
