import lbVars from "linebridge/dist/vars"

export default function (req, res) {
	if (req.method === "OPTIONS") {
		return res.status(204).end()
	}

	res.end("pong")
}
