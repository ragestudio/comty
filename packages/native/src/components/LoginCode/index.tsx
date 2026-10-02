import React from "react"
import { YStack } from "tamagui"

import Text from "@/ui/Text"
import Input from "@/ui/Input"
import Button from "@/ui/Button"
import { RNHostView } from "@expo/ui"

const LoginCode = ({ onDone }: { onDone: Function }) => {
	const [code, setCode] = React.useState<string>("")

	const canContinue = () => {
		if (!code) return false
		if (code.trim().length < 3) return false

		return true
	}

	const handleOnDone = () => {
		if (!canContinue()) return
		if (typeof onDone === "function") onDone(code)
	}

	return (
		<RNHostView>
			<YStack
				flex={1}
				gap="$5"
			>
				<Text type="big">Enter the 2FA Code</Text>

				<YStack gap="$2">
					<Input
						placeholder="x-x-x-x"
						onChangeText={(str) => setCode(str)}
					/>
					<Button
						type="primary"
						disabled={!canContinue()}
						onPress={handleOnDone}
					>
						Continue
					</Button>
				</YStack>
			</YStack>
		</RNHostView>
	)
}

export default LoginCode
