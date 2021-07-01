import React from "react"
import "./index.less"

export default class Splash extends React.Component {
	render() {
		return (
			<div className="splash-wrapper">
				<div className="bouncy-logo">
					<div className="ball">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							xmlnsXlink="http://www.w3.org/1999/xlink"
							viewBox="0 0 100 120"
						>
							<defs>
								<linearGradient
									id="glowingLinearGradient"
									x1="0"
									y1="0"
									x2="100%"
									y2="100%"
									gradientUnits="userSpaceOnUse"
								>
									<stop stopColor="#d03c4a" offset="10%" />
									<stop stopColor="#ac4ada" offset="20%" />
									<stop stopColor="#0087ff" offset="30%" />
									<stop stopColor="#2400ff" offset="40%" />
									<stop stopColor="#ff1d7a" offset="70%" />
									<stop stopColor="#f5381b" offset="80%" />
									<stop stopColor="#ff5335" offset="90%" />
									<stop stopColor="#691eff" offset="100%" />
								</linearGradient>
							</defs>
							<path
								style={{ stroke: "url(#glowingLinearGradient)" }}
								d="M77.55,29.69,92,18.78a1.42,1.42,0,0,0,.25-2,39.2,39.2,0,0,0-56.31-4.21A38.05,38.05,0,0,0,23.23,42a38.09,38.09,0,0,0,3.62,15.1A38.65,38.65,0,0,0,37.8,70.84,39.46,39.46,0,0,0,83.37,73a38.26,38.26,0,0,0,8.41-7.4,1.41,1.41,0,0,0-.23-2L77.65,53a1.43,1.43,0,0,0-1.9.15A17,17,0,0,1,72.55,56a17.75,17.75,0,0,1-9,2.88c-8.32.31-13.62-5.69-14-6.13a17.68,17.68,0,0,1-4.13-10.13,17.93,17.93,0,0,1,4.56-13A17.46,17.46,0,0,1,71.7,26.34a17.3,17.3,0,0,1,4,3.2A1.41,1.41,0,0,0,77.55,29.69Z"
							/>
							<path
								style={{ stroke: "url(#glowingLinearGradient)" }}
								d="M13,63.17a2.77,2.77,0,0,1,3.75,1.43A48.38,48.38,0,0,0,32.07,84.53,48.83,48.83,0,0,0,52.34,93.3,47.37,47.37,0,0,0,92.57,81.8a2.77,2.77,0,0,1,4,.3l6.23,7.4a2.79,2.79,0,0,1-.21,3.83,63.83,63.83,0,0,1-6,5,62.21,62.21,0,0,1-7.44,4.7A60.84,60.84,0,0,1,77,108a62.3,62.3,0,0,1-27,1.51A62.51,62.51,0,0,1,40.18,107,61.5,61.5,0,0,1,20.1,95.69,61.73,61.73,0,0,1,2.41,71a2.79,2.79,0,0,1,1.42-3.55Z"
							/>
						</svg>
					</div>
				</div>
				<div className="glow"></div>
			</div>
		)
	}
}