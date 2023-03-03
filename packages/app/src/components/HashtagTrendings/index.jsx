import React from "react"
import { Icons } from "components/Icons"

import "./index.less"

const TrendingItem = (props) => {
    return <div
        key={props.index}
        className="trendingItem"
    >

    </div>
}

// TODO: Implement this component
export default (props) => {
    const [trendings, setTrendings] = React.useState([])

    return <div className="hashtagTrendings">
        {
            trendings.map((trending, index) => {
                return <TrendingItem
                    index={index}
                    data={trending}
                />
            })
        }
    </div>
}