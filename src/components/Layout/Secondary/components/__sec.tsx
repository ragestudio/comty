import * as React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import * as Icons from '@ant-design/icons'
import styles from './__sec.less'
import classnames from 'classnames'
import reactable from 'reactablejs'

export interface __sec_props {
    y?: number;
    getRef: React.Ref<HTMLDivElement>;
    isMobile: boolean;
    functs: any;
    render: any;
    type: any; 
}

const isOpen = (props: __sec_props) => {
    const t_full = props.type === 'full_open'? true : false
    const t_def = props.type === 'active'? true: false 
    if (t_full || t_def ) {
        return true
    }
    return false
}
const isMobile = (props: __sec_props) => {
    props.isMobile? true : false
} 

const renderExit = (props: __sec_props) => {
    const {functs} = props
    if (isOpen) {
        return <div className={styles.exit_button}>
            <antd.Button type="ghost" icon={<Icons.LeftOutlined />} onClick={() => functs.Swapper.close()}> Back </antd.Button>
            </div>
    }
    return null
}

const __sec = (props: __sec_props) => {
    const { render, getRef, y, type } = props
    const t_full = type === 'full_open'? true : false
    const t_def = type === 'active'? true: false 
    return (
        <div
            id="secondary_layout__sec"
            className={classnames(styles.secondary_container_2, {
                [styles.mobile]: isMobile,
                [styles.active]: t_def,
                [styles.full_open]: t_full,
            })}
            style={{
                position: 'relative',
                top: y,
            }}
            ref={getRef}
        >

            <div className={styles.sec_body}>
                {renderExit}
                <React.Fragment>
                    {render}
                </React.Fragment>
            </div>
        </div>
    )
}


__sec.defaultProps = {
    render: null,
    y: 0,
    isMobile: false,
    functs: null,
    type: null,
}

export default __sec