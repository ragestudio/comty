import React from "react"

import ReleaseEditor from "@components/MusicStudio/ReleaseEditor"

const ReleaseEditorPage = (props) => {
    const { release_id } = props.params

    return <ReleaseEditor
        release_id={release_id}
    />
}

export default ReleaseEditorPage