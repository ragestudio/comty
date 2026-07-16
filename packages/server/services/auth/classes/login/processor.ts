export interface LoginContext {
	request: any
	payload: {
		username?: string
		password?: string
		mfa_code?: string
		refreshToken?: string
		authToken?: string
	}
	user?: any
	userConfig?: any
	userTotp?: any
	session?: any
	result?: any
	isFinished: boolean
}

export abstract class LoginStage {
	abstract execute(context: LoginContext): Promise<void>
}

export class LoginProcessor {
	private stages: LoginStage[] = []

	addStage(stage: LoginStage): this {
		this.stages.push(stage)
		return this
	}

	async process(context: LoginContext): Promise<any> {
		for (const stage of this.stages) {
			if (context.isFinished) break
			await stage.execute(context)
		}
		return context.result
	}
}

export default LoginProcessor
