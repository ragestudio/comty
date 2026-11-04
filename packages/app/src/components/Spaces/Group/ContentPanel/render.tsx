import { useContentContext } from "./context"

export const ContentPanelRender = () => {
	const { definition, contextData } = useContentContext()

	if (!definition?.component) {
		return null
	}

	const Component = definition.component

	return (
		<Component
			_id={contextData?._id}
			contextData={contextData}
		/>
	)
}

export default ContentPanelRender
