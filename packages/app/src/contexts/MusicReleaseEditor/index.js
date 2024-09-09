import React from "react"

export const DefaultReleaseEditorState = {
    cover: null,
    title: "Untitled",
    type: "single",
    public: false,

    list: [],
    pendingUploads: [],

    setCustomPage: () => {},
}

export const ReleaseEditorStateContext = React.createContext(DefaultReleaseEditorState)

export default ReleaseEditorStateContext