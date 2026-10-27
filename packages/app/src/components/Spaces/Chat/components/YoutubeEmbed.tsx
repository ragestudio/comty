import ReactPlayer from "react-player"

interface YoutubeEmbedProps {
	url: string
}

const YoutubeEmbed = ({ url }: YoutubeEmbedProps) => (
	<ReactPlayer
		width="50%"
		height="100%"
		style={{
			aspectRatio: "16/9",
			minHeight: "300px",
			borderRadius: "12px",
			overflow: "hidden",
		}}
		src={url}
		controls
		config={
			{
				youtube: {
					host: "https://youtube-nocookie.com",
				},
			} as any
		}
	/>
)

export default YoutubeEmbed
