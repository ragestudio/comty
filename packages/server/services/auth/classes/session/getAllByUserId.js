export default async function (user_id) {
	return await this.Model.findAsync(
		{
			user_id: user_id,
		},
		{
			allow_filtering: true,
			raw: true,
		},
	)
}
