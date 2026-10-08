import AppText from "@/ui/Text"
import React from "react"

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
	<AppText
		fontSize={12}
		opacity={0.5}
		textTransform="uppercase"
	>
		{children}
	</AppText>
)

export default SectionTitle
