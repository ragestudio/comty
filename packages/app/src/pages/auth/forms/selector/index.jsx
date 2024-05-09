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
            <img src={app.isMobile ? config.logo.alt : config.logo.full} className="logo" />
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
                    Continue as {app.userData.username}
                </antd.Button>
            }

            <antd.Button
                onClick={onClickLogin}
                size="large"
                icon={<Icons.LogIn />}
                type="primary"
            >
                Continue with a Comty™ Account
            </antd.Button>

            <antd.Button
                onClick={onClickLogin}
                size="large"
                icon={<Icons.LogIn />}
                type="primary"
                disabled
            >
                Continue with a RageStudio© ID™
            </antd.Button>
        </div>

        <h4>Or create a new account</h4>

        <div className="actions">
            <antd.Button
                onClick={onClickRegister}
                icon={<Icons.UserPlus />}
                type="primary"
            >
                Create a Comty™ Account
            </antd.Button>

            <p>
                <Icons.Info />
                Registering a new account accepts the <a onClick={() => app.location.push("/terms")}>Terms and Conditions</a> and <a onClick={() => app.location.push("/privacy")}>Privacy policy</a> for the services provided by {config.author}
            </p>
        </div>
    </>
}

export default MainSelector