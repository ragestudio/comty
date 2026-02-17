import React from "react"

const useEscKey = (callback) => {
	const escKeyHandler = (event) => {
		if (event.key === "Escape") {
			callback()
		}
	}

	React.useEffect(() => {
		document.addEventListener("keydown", escKeyHandler)

		return () => {
			document.removeEventListener("keydown", escKeyHandler)
		}
	}, [])
}

export default useEscKey
