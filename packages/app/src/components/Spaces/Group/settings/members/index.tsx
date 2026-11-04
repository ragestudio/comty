import { Icons } from "@components/Icons"
import MembersSettings from "./render"

export default {
	key: "members",
	label: "Members",
	icon: Icons.Users,
	permission: "READ_MEMBERSHIPS",
	render: MembersSettings,
}
