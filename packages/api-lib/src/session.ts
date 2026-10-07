import type { User } from "@comty/shared/types/user"

class Session {
	token!: string
	refreshToken!: string
	user!: Partial<User>
}

export default new Session()
