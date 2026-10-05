import React from "react"
import { XStack, YStack, Form } from "tamagui"

import Button from "@/ui/Button"
import Text from "@/ui/Text"
import Input from "@/ui/Input"

import { useForm, Controller } from "react-hook-form"

import { CircleSlash } from "lucide-react-native"
import { app } from "@/engine/app"
import useMainSheetStore from "@/stores/MainSheet"
import LoginCode from "@/components/LoginCode"

type AuthValues = {
	username: string
	password: string
}

const AuthView = () => {
	const sheet = useMainSheetStore()

	const formRef = React.useRef(null)

	const [loading, setLoading] = React.useState(false)
	const [error, setError] = React.useState(null)
	const [codeRequired, setCodeRequired] = React.useState(false)

	const { control, handleSubmit, formState } = useForm<AuthValues>()

	const onSubmit = async (data: AuthValues, event?: any, code?: string) => {
		setError(null)
		setLoading(true)

		try {
			await app.auth.login(data.username, data.password, code)
		} catch (errOrAction: any) {
			if (!errOrAction.action_required) {
				console.error(errOrAction, errOrAction.response?.data)
				setError(errOrAction.response?.data?.error ?? errOrAction)
				return
			}

			sheet.open(
				"login_code",
				<LoginCode
					onDone={(code: string) => {
						sheet.close("login_code")
						onSubmit(data, event, code)
					}}
				/>,
			)
		} finally {
			setLoading(false)
		}
	}

	return (
		<YStack
			flex={1}
			gap="$5"
			padding="$5"
			alignItems="center"
			justifyContent="center"
		>
			<Text type="heading">Login with Comty™</Text>

			<Form
				width="100%"
				onSubmit={handleSubmit(onSubmit)}
				ref={formRef}
			>
				<YStack gap="$2">
					<XStack width="100%">
						<Controller
							control={control}
							name="username"
							rules={{
								required: "Username or Email is required",
								minLength: { value: 3, message: "Minimun of 3 characters" },
							}}
							render={({ field: { onChange, onBlur, value } }) => (
								<Input
									flex={1}
									disabled={loading}
									onBlur={onBlur}
									onChangeText={onChange}
									value={value}
									placeholder="john_pork"
									autoCorrect="off"
									autoCapitalize="off"
								/>
							)}
						/>
					</XStack>

					<XStack width="100%">
						<Controller
							control={control}
							name="password"
							rules={{
								required: true,
								minLength: { value: 8, message: "Minimun of 8 characters" },
							}}
							render={({ field: { onChange, onBlur, value } }) => (
								<Input
									flex={1}
									disabled={loading}
									onBlur={onBlur}
									onChangeText={onChange}
									value={value}
									placeholder="******"
									secureTextEntry={true}
									autoCorrect="off"
									autoCapitalize="off"
								/>
							)}
						/>
					</XStack>

					<Form.Trigger asChild>
						<Button
							loading={loading}
							type={formState.isValid ? "primary" : "default"}
							disabled={!formState.isValid}
						>
							Login
						</Button>
					</Form.Trigger>
				</YStack>
			</Form>

			{error && (
				<XStack
					width="100%"
					backgroundColor="$bgAccent"
					borderRadius="$10"
					padding="$3"
					gap="$3"
					alignItems="center"
				>
					<CircleSlash color={app.theme.currentTheme.colorError?.val} />
					<Text
						type="mono"
						color={app.theme.currentTheme.colorError?.val}
						fontWeight="medium"
					>
						{error}
					</Text>
				</XStack>
			)}

			<Button onPress={() => app.router?.navigate("/")}>Go to Main</Button>
		</YStack>
	)
}

export default AuthView
