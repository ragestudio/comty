import React from "react"

import * as antd from "antd"

import SyncModel from "models/sync"

export default (props) => {
    const [error, setError] = React.useState(null)

    const makeSync = async () => {
        const result = await SyncModel.spotifyCore.syncAuthCode(window.location.search.split("=")[1]).catch((err) => {
            setError(err.message)

            return false
        })

        if (result) {
            window.close()
        }
    }

    React.useEffect(() => {
        makeSync()
    }, [])

    if (error) {
        return <antd.Result
            status="error"
            title="Error while syncing your Spotify account"
            subTitle={error}
        />
    }

    return <h3>Please wait meanwhile we are syncing your Spotify account</h3>
}