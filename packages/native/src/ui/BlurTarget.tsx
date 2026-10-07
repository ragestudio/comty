import React from "react"
import type { View, ViewProps } from "react-native"
import { BlurTargetView } from "expo-blur"

type BlurTargetValue = {
	ref: React.RefObject<View | null>
	ready: boolean
	markReady: () => void
}

const BlurTargetContext = React.createContext<BlurTargetValue | null>(null)

const InsideBlurTargetContext = React.createContext(false)

export const BlurTargetProvider = ({
	children,
}: {
	children: React.ReactNode
}) => {
	const ref = React.useRef<View | null>(null)
	const [ready, setReady] = React.useState(false)

	const markReady = React.useCallback(() => setReady(true), [])

	const value = React.useMemo(
		() => ({ ref, ready, markReady }),
		[ready, markReady],
	)

	return (
		<BlurTargetContext.Provider value={value}>
			{children}
		</BlurTargetContext.Provider>
	)
}

export const BlurTargetArea = ({ children, style, ...props }: ViewProps) => {
	const context = React.useContext(BlurTargetContext)

	React.useEffect(() => {
		if (context?.ref.current) {
			context.markReady()
		}
	}, [])

	if (!context) return <>{children}</>

	return (
		<BlurTargetView
			ref={context.ref}
			style={[{ flex: 1 }, style]}
			{...props}
		>
			<InsideBlurTargetContext.Provider value={true}>
				{children}
			</InsideBlurTargetContext.Provider>
		</BlurTargetView>
	)
}

export const useBlurTarget = () => {
	const context = React.useContext(BlurTargetContext)
	const insideTarget = React.useContext(InsideBlurTargetContext)

	if (insideTarget) return undefined
	return context?.ready ? context.ref : undefined
}
