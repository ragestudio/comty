import * as React from 'react'
import * as antd from 'antd'
import { LeftOutlined } from 'components/Icons'

export interface overlay_primary_props {
    y?: number;
    getRef: React.Ref<HTMLDivElement>;
    isMobile: boolean;
    fragment: any;
    mode: string;
    closable: boolean;
}

const renderExit = <antd.Button
    className={window.classToStyle("overlay_backButton")}
    type="ghost"
    icon={<LeftOutlined />}
    onClick={() => window.overlaySwap.close()}
> Back </antd.Button>

const overlay_primary = (props: overlay_primary_props) => {
    const { fragment, mode, isMobile } = props
    return (
        <div focus="no_loose" className={window.classToStyle("overlay_content_body")}>
            {props.mode === 'full' || props.mode === 'half' ? renderExit : null}
            <React.Fragment>{fragment}</React.Fragment>
        </div>
    )
}


overlay_primary.defaultProps = {
    mode: false,
    fragment: null,
    isMobile: false,
    closable: true,
    y: 0,
}

export default overlay_primary