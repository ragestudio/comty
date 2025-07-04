import React from "react"
import { useRouteError } from "react-router"
import { Flex, Button } from "antd"
import Image from "@components/Image"

import excuses from "@config/excuses"
import randomErrorImages from "@config/randomErrorImages"

const detailsPreStyle = {
	overflow: "hidden",
	wordBreak: "break-word",
	whiteSpace: "pre-wrap",
	userSelect: "text",
	backgroundColor: "var(--background-color-accent)",
	padding: "7px",
	borderRadius: "5px",
}

const PageErrorBoundary = (props) => {
	const error = useRouteError()
	const errorId = React.useCallback(
		() => `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		[],
	)
	const errorInfo = error?.errorInfo

	const handleRetry = () => {}

	const handleReload = () => {
		window.location.reload()
	}

	const handleGoHome = () => {
		if (window.app?.location?.push) {
			window.app.location.push("/")
		} else {
			window.location.href = "/"
		}
	}

	const copyErrorDetails = () => {
		const errorDetails = {
			errorId: errorId,
			message: error?.message,
			stack: error?.stack,
			componentStack: errorInfo?.componentStack,
			path: props.path,
			url: window.location.href,
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
		}

		const errorText = JSON.stringify(errorDetails, null, 2)

		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(errorText).then(() => {
				app.message.success("Details copied to clipboard")
			})
		}
	}

	return (
		<Flex
			vertical
			gap={20}
			style={{
				overflow: "hidden",
				width: "100%",
			}}
		>
			<Flex horizontal gap={20} align="center">
				<Image
					src={
						randomErrorImages[
							Math.floor(Math.random() * randomErrorImages.length)
						]
					}
					style={{
						width: 128,
						height: 128,
						objectFit: "cover",
						overflowClipMargin: "unset",
					}}
					wrapperProps={{
						style: {
							borderRadius: "12px",
							overflow: "hidden",
						},
					}}
				/>

				<Flex vertical gap={10}>
					<h2 style={{ margin: 0, fontSize: "1.2rem" }}>
						Something went wrong
					</h2>
					<span>
						<strong>Path:</strong> {props.path || "Unknown"}
					</span>
					<span style={{ fontSize: "0.9rem", opacity: 0.8 }}>
						ID: {errorId}
					</span>
				</Flex>
			</Flex>

			<Flex vertical>
				<strong>Message:</strong>
				<pre style={detailsPreStyle}>
					{error?.message || "Unknown error"}
				</pre>
			</Flex>

			<Flex vertical gap={10}>
				<details>
					<summary style={{ cursor: "pointer", fontWeight: "bold" }}>
						Error Stack
					</summary>
					<pre style={detailsPreStyle}>
						{error?.stack || "No stack trace available"}
					</pre>
				</details>

				<details>
					<summary style={{ cursor: "pointer", fontWeight: "bold" }}>
						Component Stack
					</summary>
					<pre style={detailsPreStyle}>
						{errorInfo?.componentStack ||
							"No component stack available"}
					</pre>
				</details>

				<details open>
					<summary style={{ cursor: "pointer", fontWeight: "bold" }}>
						Excuse
					</summary>
					<pre style={detailsPreStyle}>
						{excuses[Math.floor(Math.random() * excuses.length)]}
					</pre>
				</details>
			</Flex>

			<Flex horizontal gap={10}>
				<Button onClick={handleRetry}>🔄 Retry</Button>
				<Button onClick={handleReload}>🔄 Reload Page</Button>
				<Button onClick={copyErrorDetails}>
					📋 Copy Error Details
				</Button>
				<Button onClick={handleGoHome}>🏠 Go Home</Button>
			</Flex>
		</Flex>
	)
}

export default PageErrorBoundary
