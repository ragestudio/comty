import AppText from "@/ui/Text"
import { XStack } from "tamagui"

export const InfoRow = ({ label, value }: { label: string; value: string }) => (
	<XStack
		alignItems="center"
		justifyContent="space-between"
	>
		<AppText
			type="mono"
			fontSize={12}
			opacity={0.6}
		>
			{label}
		</AppText>
		<AppText
			type="mono"
			fontSize={12}
		>
			{value}
		</AppText>
	</XStack>
)
