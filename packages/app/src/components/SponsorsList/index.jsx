import React from "react"
import { Skeleton } from "antd"

import "./index.less"

const SponsorsList = () => {
	const fetchAPI =
		"https://raw.githubusercontent.com/ragestudio/comty/refs/heads/master/sponsors.json"

	const [loading, setLoading] = React.useState(true)
	const [sponsors, setSponsors] = React.useState(null)
	const [failed, setFailed] = React.useState(false)

	React.useEffect(() => {
		fetch(fetchAPI).then(async (response) => {
			setLoading(false)

			if (response.status !== 200) {
				setFailed(true)
				return
			}

			setSponsors(await response.json())

			return response
		})
	}, [])

	if (failed) {
		return null
	}

	if (loading) {
		return <Skeleton active />
	}

	return (
		<div className="group">
			<h3>Thanks to our sponsors</h3>

			<div className="sponsors_list">
				{sponsors &&
					sponsors.map((sponsor, index) => {
						return (
							<a
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
						)
					})}
			</div>
		</div>
	)
}

export default SponsorsList
