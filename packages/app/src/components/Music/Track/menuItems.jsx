import { Icons } from "@components/Icons"

export default [
	{
		key: "like",
		icon: <Icons.Heart />,
		label: "Like",
	},
	{
		key: "share",
		icon: <Icons.Share />,
		label: "Share",
		disabled: true,
	},
	{
		key: "add_to_playlist",
		icon: <Icons.ListPlus />,
		label: "Add to playlist",
		disabled: true,
	},
	{
		type: "divider",
	},
	{
		key: "add_to_queue",
		icon: <Icons.ListEnd />,
		label: "Add to queue",
	},
	{
		key: "play_next",
		icon: <Icons.SkipForward />,
		label: "Play next",
	},
	{
		type: "divider",
	},
	{
		key: "copy_id",
		icon: <Icons.Link2 />,
		label: "Copy ID",
	},
]
