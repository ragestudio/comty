import React from "react"
import { handleTitle } from "@hooks/onPageMount"

export default (): [string, React.Dispatch<React.SetStateAction<string>>] => {
	const [documentTitle, setDocumentTitle] = React.useState<string>(
		document.title,
	)

	React.useEffect(() => {
		if (documentTitle !== document.title) {
			handleTitle(documentTitle)
		}
	}, [documentTitle])

	return [documentTitle, setDocumentTitle]
}
