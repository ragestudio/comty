import React from "react"
import * as antd from "antd"
import axios from "axios"

import "./index.less"

const LyricsTextView = (props) => {
    const { lrcURL } = props

    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState(null)
    const [lyrics, setLyrics] = React.useState(null)

    async function getLyrics(resource_url) {
        setError(null)
        setLoading(true)
        setLyrics(null)

        const data = await axios({
            method: "get",
            url: resource_url,
            responseType: "text"
        }).catch((err) => {
            console.error(err)
            setError(err)

            return null
        })

        if (data) {
            setLyrics(data.data.split("\n"))
        }

        setLoading(false)
    }

    React.useEffect(() => {
        getLyrics(lrcURL)
    }, [lrcURL])

    if (!lrcURL) {
        return null
    }

    if (error) {
        return <antd.Result
            status="warning"
            title="Failed"
            subTitle={error.message}
        />
    }

    if (loading) {
        return <antd.Skeleton active />
    }

    if (!lyrics) {
        return <p>No lyrics provided</p>
    }

    return <div className="lyrics-text-view">
        {
            lyrics?.map((line, index) => {
                return <div
                    key={index}
                    className="lyrics-text-view-line"
                >
                    {line}
                </div>
            })
        }
    </div>
}

export default LyricsTextView