import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
    Result,
    Skeleton
} from "antd"
import { SiGithub } from "react-icons/si"
import config from "config"

import "./index.less"

const FetchChangelogs = async () => {
    const response = await app.cores.api.customRequest({
        method: "GET",
        url: `/release-notes`,
    })

    return response.data
}

export default {
    id: "changelogs",
    icon: "MdHistory",
    label: "Changelogs",
    group: "bottom",
    render: () => {
        const [L_Changelogs, R_Changelogs, E_Changelogs,] = app.cores.api.useRequest(FetchChangelogs)

        console.log(R_Changelogs, E_Changelogs)

        if (L_Changelogs) {
            return <Skeleton active />
        }

        if (E_Changelogs) {
            return <Result
                status="warning"
                title="Cannot load changelogs"
                subTitle="Something went wrong, please try again later."
            />
        }

        if (!Array.isArray(R_Changelogs)) {
            return <Result
                status="error"
                title="Changelogs error"
                subTitle="The response is not valid."
            />
        }

        return <div className="changelogs">
            {
                R_Changelogs.map((changelog, index) => {
                    return <div id={changelog.version} key={index} className="changelog_entry">
                        <div className="changelog_entry_header">
                            <h1>v{changelog.version}</h1>
                            <p>{changelog.date}</p>
                        </div>

                        <div className="changelog_entry_body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {changelog.body}
                            </ReactMarkdown>
                        </div>
                    </div>
                })
            }

            <div
                className="changelog_entry"
                style={{
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                }}
                onClick={() => {
                    window.open(config.githubRepoLink, "_blank")
                }}
            >
                <SiGithub
                    style={{
                        fontSize: "2rem",
                        marginBottom: "10px"
                    }}
                />
                <h1
                    style={{
                        margin: 0,
                    }}
                >
                    View more on Github
                </h1>
            </div>
        </div>
    }
}