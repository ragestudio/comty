import { Result, Skeleton } from "antd"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import use from "comty.js/hooks/use"

import "./index.less"

const fetchText = async (url, args) => {
	return await (await fetch(url, args)).text()
}

const MarkdownReader = (props) => {
	const { loading, result, error } = use(fetchText, props.url, {
		method: "GET",
	})

	if (error) {
		return (
			<Result
				status="warning"
				title="Cannot load this document"
				subTitle="Something went wrong, please try again later."
			/>
		)
	}

	if (loading) {
		return <Skeleton active />
	}

	return (
		<div className="document_viewer">
			<ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
		</div>
	)
}

export default MarkdownReader
