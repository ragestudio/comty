import Model from "../../model"

import { Definition } from "../../decorators/Definition"

export class User extends Model {
	async self(params?: { basic?: boolean }) {
		const response = await this.request({
			method: "GET",
			url: `/users/self`,
			params: { basic: params?.basic ?? false },
		})

		return response.data
	}

	async data(
		payload: { username?: string; user_id?: string; basic?: boolean } = {},
	): Promise<any> {
		let { username, user_id, basic = false } = payload

		if (!username && !user_id) {
			const response = await this.request({
				method: "GET",
				url: `/users/self`,
				params: { basic },
			})
			return response.data
		}

		if (username && !user_id) {
			const resolveResponse = await this.request({
				method: "GET",
				url: `/users/${username}/resolve-user_id`,
			})
			user_id = resolveResponse.data.user_id
		}

		if (!user_id && !username) {
			return {}
		}

		const response = await this.request({
			method: "GET",
			url: `/users/${user_id}/data`,
			params: { basic },
		})

		return response.data
	}

	/**
	 * Updates the user data with the given payload.
	 */
	@Definition((update) => ({
		method: "PUT",
		url: "/users/self/data",
		data: update,
	}))
	updateData!: (update: any) => Promise<any>

	/**
	 * Update the public name to null in the user data.
	 */
	@Definition(() => ({
		method: "PUT",
		url: "/users/self/data",
		data: { public_name: null },
	}))
	unsetPublicName!: () => Promise<any>

	/**
	 * Retrieves the roles of a user.
	 */
	@Definition((user_id) => ({
		method: "GET",
		url: user_id ? `/users/${user_id}/roles` : "/users/self/roles",
	}))
	getRoles!: (user_id?: string) => Promise<any[]>

	/**
	 * Retrieves the badges for a given user.
	 */
	@Definition((user_id) => ({
		method: "GET",
		url: user_id ? `/users/${user_id}/badges` : "/users/self/badges",
	}))
	getBadges!: (user_id?: string) => Promise<any[]>

	/**
	 * Retrive user config from server
	 */
	@Definition((key) => ({
		method: "GET",
		url: "/users/self/config",
		params: { key },
	}))
	getConfig!: (key?: string) => Promise<any>

	/**
	 * Update the configuration with the given update.
	 */
	@Definition((update) => ({
		method: "PUT",
		url: "/users/self/config",
		data: update,
	}))
	updateConfig!: (update: any) => Promise<any>

	@Definition((user_id) => ({
		method: "GET",
		url: user_id
			? `/users/${user_id}/public-key`
			: "/users/self/public-key",
	}))
	getPublicKey!: (user_id?: string) => Promise<any>

	@Definition((key) => ({
		method: "POST",
		url: "/users/self/public-key",
		data: { key },
	}))
	updatePublicKey!: (key: string) => Promise<any>

	@Definition(() => ({
		method: "POST",
		url: "/users/self/totp/generate",
	}))
	generateTotp!: () => Promise<any>

	@Definition((token) => ({
		method: "POST",
		url: "/users/self/totp/enable",
		data: { token },
	}))
	enableTotp!: (token: string) => Promise<any>

	@Definition((token) => ({
		method: "POST",
		url: "/users/self/totp/disable",
		data: { token },
	}))
	disableTotp!: (token: string) => Promise<any>

	@Definition((user_id) => ({
		method: "GET",
		url: user_id ? `/users/${user_id}/avatar` : "/users/self/avatar",
	}))
	getAvatar!: (user_id?: string) => Promise<any>

	@Definition((user_id) => ({
		method: "GET",
		url: `/users/${user_id}/connected`,
	}))
	isUserConnected!: (user_id: string) => Promise<any>

	@Definition((platform) => ({
		method: "GET",
		url: `/client-versions/${platform}`,
	}))
	checkVersions!: (platform: string) => Promise<any>

	decorations = new UserDecorations()
}

export class UserDecorations extends Model {
	@Definition((user_id) => ({
		method: "GET",
		url: `/users/${user_id}/decorations`,
	}))
	get!: (user_id: string) => Promise<any>
}

export default new User()
