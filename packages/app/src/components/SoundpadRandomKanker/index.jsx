import { Button } from "antd"

const SoundpadRandomKanker = ({ dispatch }) => {
	const dispatchRandomAudio = async () => {
		let response = await fetch("https://msk.ragestudio.net/api?random=true")

		const data = await response.json()

		dispatch({
			src: data.tts_file,
			icon: "si",
		})
	}

	return <Button onClick={dispatchRandomAudio}>Random kanker</Button>
}

export default SoundpadRandomKanker
