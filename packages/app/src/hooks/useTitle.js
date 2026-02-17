import React from "react"
import { handleTitle } from "@hooks/onPageMount"

export default () => {
	const [documentTitle, setDocumentTitle] = React.useState(document.title)

	React.useEffect(() => {
		if (documentTitle !== document.title) {
			handleTitle(documentTitle)
		}
	}, [documentTitle])

	return [documentTitle, setDocumentTitle]
}
