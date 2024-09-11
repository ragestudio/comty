import React from "react"
import axios from "axios"

import config from "@config"

import "./index.less"

async function readLicenses() {
    const { data } = await axios.get(config.ossLicensesUrl)

    return data
}

const PackageItem = (props) => {
    const { name, version, author, license } = props.pkg

    async function openLicenseView(id) {
        const { data } = await axios.get(`https://licenses.opendefinition.org/licenses/${id}.json`)

        window.open(data.url, "_blank")
    }

    return <div className="tdp-page-list-item">
        <h2>{name}</h2>

        <div className="tdp-page-list-item-info">
            <p>Version: {version}</p>
            {
                author && (author.name ? <p>Author: {author.name}</p> : <p>Author: {author}</p>)
            }
            <p>License: {license}</p>
        </div>

        <a onClick={() => openLicenseView(license)}>View License</a>
    </div>
}

const OpenSourceLibrariesPage = () => {
    const [libraries, setLibraries] = React.useState([])

    async function initialize() {
        setLibraries(await readLicenses())
    }

    React.useEffect(() => {
        initialize()
    }, [])

    return <div className="tpd-page">
        <div className="tpd-page-header">
            <h1>
                Open Source Libraries
            </h1>
            <p>
                ❤️ {config.app.siteName} works thanks to all the amazing following open source libraries. ❤️
            </p>
        </div>

        <div className="tdp-page-list">
            {
                libraries.map((pkg, index) => {
                    return <PackageItem
                        key={index}
                        pkg={pkg}
                    />
                })
            }
        </div>
    </div>
}

export default OpenSourceLibrariesPage