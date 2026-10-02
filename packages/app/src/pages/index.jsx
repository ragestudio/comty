const HomePage = () => {
	const defaultPage = app.cores.settings.get("app:default_page")

	if (defaultPage) {
		return app.location.push(`/${defaultPage}`)
	}

	return app.location.push("/timeline")
}

export default HomePage
