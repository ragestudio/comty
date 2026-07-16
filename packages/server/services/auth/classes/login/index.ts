import { LoginProcessor, LoginContext } from "./processor"
import IdentificationStage from "./stages/identification"
import AuthenticationStage from "./stages/authentication"
import AccountValidationStage from "./stages/validation"
import MFAStage from "./stages/mfa"
import AuthorizationStage from "./stages/authorization"

export default async (req: any): Promise<any> => {
	const processor = new LoginProcessor()

	const context: LoginContext = {
		request: req,
		payload: req.body,
		isFinished: false,
	}

	processor
		.addStage(new IdentificationStage())
		.addStage(new AuthenticationStage())
		.addStage(new AccountValidationStage())
		.addStage(new MFAStage())
		.addStage(new AuthorizationStage())

	return await processor.process(context)
}
