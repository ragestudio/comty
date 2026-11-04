export class AuthorizationError extends OperationError {
	constructor(message = "You are not allowed to perform this action") {
		super(403, message)
	}
}
