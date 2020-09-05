import * as React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import styles from '../../index.less'
import classnames from 'classnames'
import { Swapper } from '../../index.js'

export interface overlay_primary_props {
    y?: number;
    getRef: React.Ref<HTMLDivElement>;
    isMobile: boolean;
    fragment: any;
    mode: string;
    closable: boolean;
}


const renderExit = (
    <div className={styles.exit_button}>
    <antd.Button type="ghost" icon={<Icons.LeftOutlined />} onClick={() => Swapper.closeAll()}> Back </antd.Button>
    </div>
)


const overlay_primary = (props: overlay_primary_props) => {
    const { fragment, mode, isMobile } = props
    return (
        <div
            id="overlay_primary"
            className={classnames(styles.overlay_primary_wrapper, {
                [styles.full]: mode === 'full'? true : false,
                [styles.half]: mode === 'half'? true : false,
            })}
        >
            <div className={styles.renderBody}>
                {props.mode === 'full' || props.mode === 'half'? renderExit : null}
                <React.Fragment>{fragment}</React.Fragment>
            </div>
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