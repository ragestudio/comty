import { Icons } from "@components/Icons"

export default [
	{
		key: "like",
		icon: <Icons.MdFavorite />,
		label: "Like",
	},
	{
		key: "share",
		icon: <Icons.MdShare />,
		label: "Share",
		disabled: true,
	},
	{
		key: "add_to_playlist",
		icon: <Icons.MdPlaylistAdd />,
		label: "Add to playlist",
		disabled: true,
	},
	{
		type: "divider",
	},
	{
		key: "add_to_queue",
		icon: <Icons.MdQueueMusic />,
		label: "Add to queue",
	},
	{
		key: "play_next",
		icon: <Icons.MdSkipNext />,
		label: "Play next",
	},
	{
		type: "divider",
	},
	{
		key: "copy_id",
		icon: <Icons.MdLink />,
		label: "Copy ID",
	},
]
