import React from "react"
import config from "@config"

class Splash extends React.Component {
    state = {
        visible: true
    }

    onUnmount = async () => {
        this.setState({
            visible: false
        })

        return await new Promise((resolve) => {
            setTimeout(resolve, 1000)
        })
    }

    render() {
        return <div
            className={this.state.visible ? "app_splash_wrapper" : "app_splash_wrapper fade-away"}
        >
            {/* <div className="layers_wrapper">
                <div class="square">
                    <div class="square">
                        <div class="square">
                            <div class="square">
                                <div class="square">
                                    <div class="square">
                                        <div class="square">
                                            <div class="square">
                                                <div class="square">
                                                    <div class="square">
                                                        <div class="square">
                                                            <div class="square">
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}

            <div className="content">
                <img
                    src={config.logo.alt}
                />

                <div className="loader_wrapper">
                    <div
                        className="loader"
                    >
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
            </div>
        </div>
    }
}

export default Splash