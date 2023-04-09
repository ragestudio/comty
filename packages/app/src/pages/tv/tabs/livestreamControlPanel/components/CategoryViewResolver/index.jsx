import React from "react"
import { createIconRender } from "components/Icons"

import Livestream from "models/livestream"

export default (props) => {
    const category = props.category

    const [categoryData, setCategoryData] = React.useState(null)

    const loadData = async () => {
        const categoryData = await Livestream.getCategories(category).catch((err) => {
            console.error(err)

            app.message.error("Failed to load category")

            return null
        })

        setCategoryData(categoryData)
    }

    React.useEffect(() => {
        if (props.category) {
            loadData()
        }
    }, [props.category])

    return <div className="category">
        {
            categoryData?.icon &&
            <div className="icon">
                {createIconRender(categoryData.icon)}
            </div>
        }

        <div className="label">
            {categoryData?.label ?? "No category"}
        </div>
    </div>
}
