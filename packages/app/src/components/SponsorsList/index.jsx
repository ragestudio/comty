import React from "react"
import { Skeleton } from "antd"

import "./index.less"

const SponsorsList = () => {
    const fetchAPI = "https://raw.githubusercontent.com/ragestudio/comty/refs/heads/master/sponsors.json"

    const [loading, setLoading] = React.useState(true)
    const [sponsors, setSponsors] = React.useState(null)

    React.useEffect(() => {
        fetch(fetchAPI)
            .then((response) => response.json())
            .then((data) => {
                setLoading(false)
                setSponsors(data)
            })
    }, [])

    if (loading) {
        return <Skeleton active />
    }

    return <div className="sponsors_list">
        {
            sponsors && sponsors.map((sponsor, index) => {
                return <a
                    key={index}
                    href={sponsor.url}
                    target="_blank"
                    rel="noreferrer"
                    className="sponsor"
                >
                    <img
                        src={sponsor.promo_badge}
                        alt={sponsor.name}
                    />
                </a>
            })
        }
    </div>
}

export default SponsorsList