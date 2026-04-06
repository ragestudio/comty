export default async function (session_id) {
	return await this.Model.findOne(
		{
			_id: session_id,
		},
		{
			raw: true,
		},
	)
}
