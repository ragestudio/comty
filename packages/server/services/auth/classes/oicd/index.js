import { Provider } from "oidc-provider"
import { User } from "@db_models"

class Adapter {
	constructor(name) {
		this.name = name
	}

	static get OidcClient() {
		return global.scylla.model("oidc_apps")
	}

	static get OidcStore() {
		return global.scylla.model("oidc_store")
	}

	async upsert(id, payload, expiresIn) {
		if (this.name === "Client") {
			const client = new Adapter.OidcClient({
				client_id: id,
				client_secret: payload.client_secret,
				client_name: payload.client_name,
				owner_id: payload.owner_id,
				redirect_uris: payload.redirect_uris || [],
				grant_types: payload.grant_types || [],
				response_types: payload.response_types || [],
			})

			return await client.saveAsync()
		}

		const options = expiresIn ? { ttl: expiresIn } : {}

		const store = new Adapter.OidcStore({
			id: id,
			type: this.name,
			payload: JSON.stringify(payload),
			grantId: payload.grantId,
			uid: payload.uid,
		})

		await store.saveAsync(options)
	}

	async find(id) {
		if (this.name === "Client") {
			const client = await Adapter.OidcClient.findOneAsync(
				{ client_id: id },
				{ raw: true },
			)

			if (!client) {
				return undefined
			}

			return {
				...client,
				id: client.client_id,
			}
		}

		const data = await Adapter.OidcStore.findOneAsync(
			{ id: id },
			{ raw: true },
		)
		return data ? JSON.parse(data.payload) : undefined
	}

	async consume(id) {
		const data = await Adapter.OidcStore.findOneAsync({ id: id })

		if (data) {
			data.consumedAt = new Date()
			await data.saveAsync()
		}
	}

	async destroy(id) {
		await Adapter.OidcStore.deleteAsync({ id: id })
	}

	async revokeByGrantId(grantId) {
		await Adapter.OidcStore.deleteAsync({ grantId: grantId })
	}
}

export default class OIDCProvider {
	constructor(issuerUrl) {
		if (!process.env.JWKS_KEYS) {
			throw new Error("JWKS_KEYS not found in environment")
		}

		const jwks_keys = JSON.parse(process.env.JWKS_KEYS)

		if (!jwks_keys) {
			throw new Error("failed to parse JWKS_KEYS")
		}

		this.provider = new Provider(issuerUrl, {
			adapter: Adapter,
			findAccount: this.findAccount,
			jwks: {
				keys: jwks_keys,
			},
			interactions: {
				url: (ctx, interaction) =>
					`/oidc/interaction/${interaction.uid}`,
			},
			features: { devInteractions: { enabled: false } },
		})
	}

	get callback() {
		return this.provider.callback()
	}

	async findAccount(ctx, user_id) {
		const user = await User.findOne({ _id: user_id }).lean()

		if (!user) {
			return undefined
		}

		return {
			accountId: user_id,
			async claims(use, scope) {
				return {
					sub: user_id,
					email: user.email,
					username: user.nombre,
					// preferencias: user.settings,
				}
			},
		}
	}

	async registerUserApp(userId, { appName, redirectUris }) {
		const clientId = crypto.randomBytes(16).toString("hex")
		const clientSecret = crypto.randomBytes(32).toString("hex")

		const newApp = new Adapter.OidcClient({
			client_id: clientId,
			client_secret: clientSecret,
			client_name: appName,
			owner_id: userId,
			redirect_uris: redirectUris,
			grant_types: ["authorization_code", "refresh_token"],
			response_types: ["code"],
		})

		await newApp.saveAsync()

		return { clientId, clientSecret }
	}

	async getAppsByDeveloper(userId) {
		return await Adapter.OidcClient.findAsync(
			{ owner_id: userId },
			{ raw: true },
		)
	}
}
