import InviteJoinCard from "@components/InviteJoinCard"

import "./index.less"

const InviteJoinPage = ({ params }) => {
	return (
		<InviteJoinCard
			group_id={params.group_id}
			invite_key={params.key}
		/>
	)
}

export default InviteJoinPage
