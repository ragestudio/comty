import React from "react"
import * as antd from "antd"

import "./index.less"

const useGetMainOrigin = () => {
    const [mainOrigin, setMainOrigin] = React.useState(null)

    React.useEffect(() => {
        const instance = app.cores.api.client()

        if (instance) {
            setMainOrigin(instance.mainOrigin)
        }

        return () => {
            setMainOrigin(null)
        }
    }, [])

    return mainOrigin
}

export default {
    id: "api",
    icon: "TbApi",
    label: "API",
    group: "advanced",
    render: () => {
        const mainOrigin = useGetMainOrigin()
        const [keys, setKeys] = React.useState([])

        return <div className="developer-settings">
            <div className="card">
                <h3>
                    Main Origin
                </h3>
                <p>
                    {mainOrigin}
                </p>
            </div>

            <div className="card api_keys">
                <div className="api_keys_header">
                    <div className="api_keys_header_title">
                        <h3>Your Keys</h3>
                        <p>Manage your API keys</p>
                    </div>

                    <antd.Button
                        type="primary"
                    >
                        Create new
                    </antd.Button>
                </div>

                <div className="api_keys_list">
                    {
                        keys.map((key) => {
                            return null
                        })
                    }
                    {
                        keys.length === 0 && <antd.Empty />
                    }
                </div>
            </div>

            <div className="card">
                <h3>Documentations</h3>

                <div className="links">
                    <a>Comty CLI</a>
                    <a>Comty.JS for NodeJS</a>
                    <a>Comty Extensions SDK</a>
                    <a>Spectrum API</a>
                </div>
            </div>
        </div>
    }
}