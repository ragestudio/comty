import UsersModel from "@models/user"
import use from "comty.js/hooks/use"

const useFetchUserDecorations = (user_id) => {
	const { result, loading, error } = use(
		UsersModel.V2.decorations.get,
		user_id,
	)

	return {
		decorations: result,
		loading,
		error,
	}
}

export default useFetchUserDecorations
