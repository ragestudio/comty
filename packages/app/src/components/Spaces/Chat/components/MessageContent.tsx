import React from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import LinkPreview from "./LinkPreview"

const YoutubeEmbed = React.lazy(() => import("./YoutubeEmbed"))

const ShikiHighlighter = React.lazy(() =>
	import("react-shiki").then((module) => ({
		default: module.ShikiHighlighter,
	})),
)

function isInlineCode(node) {
	if (!node) return true

	return !(node.children || [])
		.filter((child) => child.type === "text")
		.map((child) => child.value)
		.join("")
		.includes("\n")
}

const CodeHighlight = ({ className, children, node, ...props }) => {
	const code = String(children).trim()
	const match = className?.match(/language-(\w+)/)
	const language = match ? match[1] : undefined

	if (isInlineCode(node)) {
		return (
			<code
				className={className}
				{...props}
			>
				{code}
			</code>
		)
	}

	return (
		<React.Suspense
			fallback={
				<pre>
					<code className={className}>{code}</code>
				</pre>
			}
		>
			<ShikiHighlighter
				language={language}
				theme="one-dark-pro"
				{...props}
			>
				{code}
			</ShikiHighlighter>
		</React.Suspense>
	)
}

function getYouTubeUrl(value: string) {
	if (!/youtu\.?be|youtube/i.test(value)) return null

	try {
		const url = new URL(value)
		const host = url.hostname.replace(/^www\./, "")

		if (host === "youtu.be") return value

		if (host !== "youtube.com" && host !== "youtube-nocookie.com") {
			return null
		}

		if (url.pathname === "/watch" && url.searchParams.get("v")) {
			return value
		}

		if (
			url.pathname.startsWith("/embed/") ||
			url.pathname.startsWith("/shorts/")
		) {
			return value
		}
	} catch {}

	return null
}

const HTTP_URL_REGEX = /^https?:\/\/\S+$/i
const WWW_URL_REGEX = /^www\.\S+$/i

function normalizeUrl(value: string) {
	return HTTP_URL_REGEX.test(value) ? value : `https://${value}`
}

const markdownComponents = {
	pre: (props) => props.children,
	code: CodeHighlight,
}

interface MessageContentProps {
	messageStr: string
}

const MessageContent = ({ messageStr }: MessageContentProps) => {
	const value = messageStr.trim()
	const youtubeCandidate = HTTP_URL_REGEX.test(value)
		? value
		: `https://${value}`
	const youtubeUrl = getYouTubeUrl(youtubeCandidate)

	if (youtubeUrl) {
		return (
			<React.Suspense fallback={null}>
				<YoutubeEmbed url={youtubeUrl} />
			</React.Suspense>
		)
	}

	if (HTTP_URL_REGEX.test(value) || WWW_URL_REGEX.test(value)) {
		return <LinkPreview url={normalizeUrl(value)} />
	}

	return (
		<Markdown
			remarkPlugins={[remarkGfm]}
			components={markdownComponents}
		>
			{messageStr}
		</Markdown>
	)
}

export default MessageContent
