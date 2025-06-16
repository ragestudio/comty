import React from "react"
import { Icons } from "@components/Icons"

import "./index.less"

export default (props) => {
    return <div className="music-studio-tracks-uploader-hint">
        <Icons.MdPlaylistAdd />

        <p>Upload your tracks</p>
        <p>Drag and drop your tracks here or click this box to start uploading files.</p>
    </div>
}