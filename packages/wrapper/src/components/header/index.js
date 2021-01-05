import * as antd from "antd";
import * as Icons from 'feather-reactjs'

export default () => {
    return(
        <div className="landing_header">
            <div className="header_brand">
            </div>
            <div className="header_links">
                <div className="header_linksBtn"><Icons.Activity /> Status </div>
                <div className="header_linksBtn"><Icons.GitCommit /> Changelogs </div>
                <div className="header_linksBtn"><Icons.Info /> About </div>
            </div>
        </div>
    )
}