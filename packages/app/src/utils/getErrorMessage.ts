export const getErrorMessage = (
	error: any,
	fallback = "An error occurred",
): string => {
	return (
		error?.response?.data?.error ??
		error?.response?.data?.message ??
		error?.message ??
		fallback
	)
}

export default getErrorMessage
