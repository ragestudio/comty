import templates from "../../../../templates"

const testData = {
	email: "test@example",
	ip: "127.0.0.1",
	client: "Firefox",
	username: "test",
	date: new Date(),
	apr_link: "https://comty.app",
	mfa_code: "000-000-000",
}

export default (req) => {
	const { email } = req.params

	if (!templates[email]) {
		throw new OperationError(404, "Template not found")
	}

	return res.html(templates[email](testData))
}
