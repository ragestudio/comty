import React from "react"

const defaultURL = "ws://localhost:19236"

function useLoquiWs() {
	const [socket, setSocket] = React.useState(null)

	function create() {
		const s = new WebSocket(defaultURL)

		s.addEventListener("open", (event) => {
			console.log("WebSocket connection opened")
		})

		s.addEventListener("close", (event) => {
			console.log("WebSocket connection closed")
		})

		s.addEventListener("error", (event) => {
			console.log("WebSocket error", event)
		})

		s.addEventListener("message", (event) => {
			console.log("Message from server ", event.data)
		})

		setSocket(s)
	}

	React.useEffect(() => {
		create()

		return () => {
			if (socket) {
				socket.close()
			}
		}
	}, [])

	return [socket]
}

const Loqui = () => {
	const [socket] = useLoquiWs()

	return <div>{defaultURL}</div>
}

export default Loqui
