import React from "react"

import UserModel from "@models/user"
import FollowsModel from "@models/follows"

const useUserData = (username) => {
	if (!username) {
		return null
	}

	const [loading, setLoading] = React.useState(true)
	const [user, setUser] = React.useState(null)

	const load = React.useCallback(async () => {
		setLoading(true)

		// first get the user data
		const data = await UserModel.data({
			username: username,
		}).catch((error) => {
			console.error(error)
			return false
		})

		if (!data) {
			setLoading(false)
			setUser(null)
			return false
		}

		// get followers count
		const followersResult = await FollowsModel.getFollowers(data._id).catch(
			(error) => {
				console.error(error)
				return false
			},
		)

		if (followersResult) {
			data.followers = followersResult.count
		}

		// get decorations
		const decorations = await UserModel.V2.decorations
			.get(data._id)
			.catch((error) => {
				console.error(error)
				return false
			})

		if (decorations) {
			data.decorations = decorations
		}

		setLoading(false)
		setUser(data)
	}, [username])

	React.useEffect(() => {
		load()
	}, [username])

	return {
		loading: loading,
		user: user,
		setUser: setUser,
		isSelf: username === app.userData.username,
	}
}

export default useUserData
