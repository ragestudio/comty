import React from "react"

const useOnPaste = (callback) => {
	React.useEffect(() => {
		const listener = (event) => {
			if (typeof callback === "function") {
				callback(event)
			}
		}

		document.addEventListener("paste", listener)

		return () => {
			document.removeEventListener("paste", listener)
		}
	}, [callback])
}

export default useOnPaste
