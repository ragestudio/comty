import React from "react"
import config from "config"

import "./index.less"

export default () => {
    const [licenses, setLicenses] = React.useState([])

    const loadLicenses = async () => {
        const deps = Object.entries(config.package.dependencies).reduce((acc, [name, version]) => {
            acc.push({
                name,
                version,
            })
            
            return acc
        }, [])

        setLicenses(deps)
    }

    React.useEffect(() => {
        loadLicenses()
    }, [])

    return <div className="tpd_list">
        {licenses.map((license) => {
            return <div className="item">
                <h3>{license.name}</h3>
                <p>{license.version}</p>
            </div>
        })}
    </div>
}
