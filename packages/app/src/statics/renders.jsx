import ErrorCatcher from "@components/ErrorCatcher"
import NotFound from "@components/NotFound"
import Crash from "@components/Crash"
import Skeleton from "@components/Skeleton"

export default {
	Loading: Skeleton,
	NotFound: NotFound,
	RenderError: ErrorCatcher,
	Crash: Crash,
}
