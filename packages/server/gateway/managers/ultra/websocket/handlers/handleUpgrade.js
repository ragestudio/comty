export default async function (res, req, ctx) {
	let data = {}

	if (!ctx.token || !this.gateway.base.params?.auth) {
		return data
	}

	let authParams = this.gateway.base.params.auth

	try {
		if (authParams.serviceId) {
			const targetOrigin = this.gateway.targets.get(authParams.serviceId)

			if (!targetOrigin) {
				throw new Error(
					`Service [${authParams.serviceId}] not found in targets`,
				)
			}

			authParams.url = new URL(
				authParams.url,
				targetOrigin.target,
			).toString()
		}

		let authResponse = await fetch(authParams.url, {
			method: authParams.method
				? authParams.method.toUpperCase()
				: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: ctx.token,
			},
		})

		if (authResponse.ok) {
			const reponseData = await authResponse.json()

			if (typeof authParams.data === "function") {
				data = {
					...authParams.data(reponseData),
				}
			} else {
				data = reponseData
			}
		}
	} catch (e) {
		this.gateway.console.error("Failed to authenticate user on upgrade:", e)

		return {}
	}

	return data
}
