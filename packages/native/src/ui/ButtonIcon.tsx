import type { ReactNode } from "react"
import type { YStackProps } from "tamagui"

import { YStack } from "tamagui"

export const ButtonIcon = ({
	icon,
	fallback,
	...props
}: {
	icon?: ReactNode
	fallback?: ReactNode
} & YStackProps) => {
	return (
		<YStack
			overflow="hidden"
			alignItems="center"
			justifyContent="center"

			backgroundColor="black"
			borderColor="$borderColor"

			borderRadius={12}
			borderWidth={2}
			{...props}
		>
			{icon ?? fallback}
		</YStack>
	)
}

export default ButtonIcon
