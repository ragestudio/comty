import React from "react"
import { StyleSheet } from "react-native"
import { BlurView } from "expo-blur"
import {
	Canvas,
	Fill,
	Group,
	ImageShader,
	useImage,
} from "@shopify/react-native-skia"
import { YStack, useTheme, type YStackProps } from "tamagui"

export interface TextureBgProps extends Omit<
	YStackProps,
	"borderRadius" | "borderWidth" | "borderColor"
> {
	blurIntensity?: number
	noiseOpacity?: number
	overlayColor?: string
	borderRadius?: number
	borderWidth?: number
	borderColor?: string
}

const TextureBg = ({
	children,
	blurIntensity = 4,
	noiseOpacity = 1,
	overlayColor = "$bgAccent",
	borderColor = "$borderColor",
	borderRadius = 0,
	borderWidth = 0,
	...layoutProps
}: TextureBgProps) => {
	const noiseImage = useImage(require("@/assets/grain-bg.png"))
	const theme = useTheme()

	const resolvedColor = React.useMemo(() => {
		if (overlayColor.startsWith("$")) {
			const tokenName = overlayColor.replace("$", "")
			return theme[tokenName]?.val || "transparent"
		}
		return overlayColor
	}, [overlayColor, theme])

	const hasBorder = borderWidth !== undefined && borderWidth > 0

	const numericBorderWidth = Number(borderWidth) || 0
	const innerRadius = Math.max(0, borderRadius - numericBorderWidth)

	const BackgroundLayer = (
		<YStack
			position="absolute"
			top={numericBorderWidth}
			bottom={numericBorderWidth}
			left={numericBorderWidth}
			right={numericBorderWidth}
			borderRadius={innerRadius}
			overflow="hidden"
			pointerEvents="none"
			zIndex={0}
		>
			{blurIntensity > 0 && (
				<BlurView
					intensity={blurIntensity}
					style={StyleSheet.absoluteFill}
					tint="default"
				/>
			)}

			<Canvas style={StyleSheet.absoluteFill}>
				<Fill color={resolvedColor} />

				{noiseImage && (
					<Group
						blendMode="color"
						opacity={noiseOpacity}
					>
						<Fill>
							<ImageShader
								image={noiseImage}
								width={220}
								height={220}
								tx="repeat"
								ty="repeat"
							/>
						</Fill>
					</Group>
				)}
			</Canvas>
		</YStack>
	)

	const BorderLayer = hasBorder ? (
		<YStack
			pointerEvents="none"
			style={StyleSheet.absoluteFill}
			borderRadius={borderRadius}
			borderWidth={borderWidth}
			borderColor={borderColor}
			zIndex={2}
		/>
	) : null

	if (!children) {
		return (
			<>
				{BackgroundLayer}
				{BorderLayer}
			</>
		)
	}

	return (
		<YStack
			position="relative"
			overflow="visible"
			{...layoutProps}
		>
			{BackgroundLayer}

			<YStack
				flex={1}
				zIndex={1}
			>
				{children}
			</YStack>

			{BorderLayer}
		</YStack>
	)
}

export default TextureBg
