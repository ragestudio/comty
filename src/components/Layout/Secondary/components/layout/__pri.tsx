import * as React from 'react'
import * as app from 'app'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import styles from '../../index.less'
import classnames from 'classnames'
import reactable from 'reactablejs'

export interface __pri_props {
    y?: number;
    getRef: React.Ref<HTMLDivElement>;
    isMobile: boolean;
    functs: any;
    render: any;
    type: any; 
}

const isOpen = (props: __pri_props) => {
    const t_full = props.type === 'full_open'? true : false
    const t_half = props.type === 'half'? true: false 
    if (t_full || t_half ) {
        return true
    }
    return false
}

const renderExit = (props: __pri_props) => {
    const {functs} = props
    if (isOpen) {
        return <div className={styles.exit_button}>
            <antd.Button type="ghost" icon={<Icons.LeftOutlined />} onClick={() => functs.Swapper.close()}> Back </antd.Button>
            </div>
    }
    return null
}


const __pri = (props: __pri_props) => {
    const { render, type, isMobile } = props
    const t_full = type == 'full_open'? true : false
    const t_half = type == 'half'? true : false 

    
    return (
        <div
            id="secondary_layout_pri"
            className={classnames(styles.secondary_container_1, {
                [styles.mobile]: isMobile,
                [styles.full_open]: t_full,
                [styles.half]: t_half,
            })}
        >

            <div className={styles.pri_body}>
                {renderExit}
                <React.Fragment>{render}</React.Fragment>
            </div>
        </div>
    )
}


__pri.defaultProps = {
    render: null,
    y: 0,
    isMobile: false,
    functs: null,
    type: null,
}

export default __pri