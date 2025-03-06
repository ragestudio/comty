import * as antd from "antd"
import config from "@config"

import { Icons } from "@components/Icons"

const MainSelector = (props) => {
	return (
		<>
			<div className="content_header">
				<img src={config.logo.alt} className="logo" />
			</div>

			<div className="actions">
				{app.userData && (
					<antd.Button
						type="default"
						size="large"
						onClick={() => {
							app.navigation.goMain()
						}}
					>
						<antd.Avatar
							size={23}
							shape="square"
							src={app.userData.avatar}
						/>{" "}
						Continue as {app.userData.username}
					</antd.Button>
				)}

				<antd.Button
					onClick={() => app.auth.login()}
					icon={<Icons.FiLogIn />}
					type="primary"
				>
					Continue with a Comty™ Account
				</antd.Button>

				<antd.Button
					onClick={() => app.auth.login()}
					icon={<Icons.FiLogIn />}
					type="primary"
					disabled
				>
					Continue with a RageStudio© ID™
				</antd.Button>

				<h4>Or create a new account</h4>

				<antd.Button
					onClick={() => props.setActiveKey("register")}
					icon={<Icons.FiUserPlus />}
					type="primary"
				>
					Create a Comty™ Account
				</antd.Button>

				<a onClick={() => props.setActiveKey("recovery")}>
					I need help to recover my account
				</a>
			</div>
		</>
	)
}

export default MainSelector
