import React from "react"
import * as antd from "antd"
import axios from "axios"

const LyricsTextView = (props) => {
    const { lang, track } = props

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
            setLyrics(data.data)
        }

        setLoading(false)
    }

    React.useEffect(() => {
        getLyrics(lang.value)
    }, [lang])

    if (!lang) {
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

    return <div>
        <p>{lyrics}</p>
    </div>
}

export default LyricsTextView