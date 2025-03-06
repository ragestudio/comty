import { NotFound, RenderError, Crash } from "@components"

export default {
	PageLoad: () => {
		return <antd.Skeleton active />
	},
	NotFound: (props) => {
		return <NotFound />
	},
	RenderError: (props) => {
		return <RenderError {...props} />
	},
	Crash: Crash.CrashWrapper,
}
