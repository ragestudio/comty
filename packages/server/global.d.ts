declare function ToBoolean(str: string): boolean

declare class OperationError {
	code: number
	message: string
	constructor(code: number, message: string)
}
