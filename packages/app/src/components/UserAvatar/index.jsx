import React from "react"
import UserModel from "@models/user"

const UserAvatar = ({ user_id }) => {
	const [avatarUrl, setAvatarUrl] = React.useState(null)

	React.useEffect(() => {
		if (user_id) {
			UserModel.getAvatar(user_id).then((url) => {
				setAvatarUrl(url)
			})
		}
	}, [user_id])

	return <img src={avatarUrl} />
}

export default UserAvatar
