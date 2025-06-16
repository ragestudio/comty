import { NotFound, Crash, Skeleton } from "@components"
import ErrorCatcher from "@components/ErrorCatcher"
export default {
	Loading: Skeleton,
	NotFound: NotFound,
	RenderError: ErrorCatcher,
	Crash: Crash.CrashWrapper,
}
