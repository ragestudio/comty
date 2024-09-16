import * as antd from "antd"
import config from "@config"

import { Icons } from "@components/Icons"

const MainSelector = (props) => {
    const {
        onClickLogin,
        onClickRegister,
    } = props

    return <>
        <div className="content_header">
            <img src={config.logo.alt} className="logo" />
        </div>

        <div className="actions">
            {
                app.userData && <antd.Button
                    type="default"
                    size="large"
                    onClick={() => {
                        app.navigation.goMain()
                    }}
                >
                    <antd.Avatar size={23} shape="square" src={app.userData.avatar} /> Continue as {app.userData.username}
                </antd.Button>
            }

            <antd.Button
                onClick={onClickLogin}
                icon={<Icons.FiLogIn />}
                type="primary"
            >
                Continue with a Comty™ Account
            </antd.Button>

            <antd.Button
                onClick={onClickLogin}
                icon={<Icons.FiLogIn />}
                type="primary"
                disabled
            >
                Continue with a RageStudio© ID™
            </antd.Button>

            <h4>Or create a new account</h4>

            <antd.Button
                onClick={onClickRegister}
                icon={<Icons.FiUserPlus />}
                type="primary"
            >
                Create a Comty™ Account
            </antd.Button>

            <p>
                <Icons.FiInfo />
                Registering a new account accepts the <a onClick={() => app.location.push("/terms")}>Terms and Conditions</a> and <a onClick={() => app.location.push("/privacy")}>Privacy policy</a> for the services provided by {config.author}
            </p>
        </div>
    </>
}

export default MainSelector