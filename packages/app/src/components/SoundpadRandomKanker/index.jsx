import { Button } from "antd"

const SoundpadRandomKanker = ({ dispatch }) => {
	const dispatchRandomAudio = async () => {
		let response = await fetch("https://msk.ragestudio.net/api?random=true")

		response = await response.json()

		dispatch(response.tts_file)
	}

	return <Button onClick={dispatchRandomAudio}>Random kanker</Button>
}

export default SoundpadRandomKanker
