import React from "react"
import * as antd from "antd"

import Livestream from "models/livestream"

export default (props) => {
    const [categories, setCategories] = React.useState([])
    const [loading, setLoading] = React.useState(true)

    const loadData = async () => {
        setLoading(true)

        const categories = await Livestream.getCategories().catch((err) => {
            console.error(err)

            app.message.error("Failed to load categories")

            return null
        })

        console.log(`Loaded categories >`, categories)

        setLoading(false)

        if (categories) {
            setCategories(categories)
        }
    }

    React.useEffect(() => {
        loadData()
    }, [])

    if (loading) {
        return <antd.Skeleton active />
    }

    return <antd.Select
        placeholder="Select a category"
        defaultValue={props.defaultValue}
        onChange={(value) => props.updateStreamInfo("category", value)}
    >
        {
            categories.map((category) => {
                return <antd.Select.Option value={category?.key ?? "unknown"}>{category?.label ?? "No category"}</antd.Select.Option>
            })
        }
    </antd.Select>
}