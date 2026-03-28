export default async function (user_id, group_id) {
	const membership = await this.model.find(
		{
			user_id: user_id,
			group_id: group_id,
		},
		{
			raw: true,
		},
	)

	return membership.length !== 0
}
