export default async function (session_id) {
	return await this.Model.findOneAsync(
		{
			_id: session_id,
		},
		{
			raw: true,
		},
	)
}
