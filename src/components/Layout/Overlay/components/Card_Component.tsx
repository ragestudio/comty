import * as React from 'react'
import * as antd from 'antd'
import * as Icons from 'components/Icons'
import styles from '../index.less'

export interface Card_Component_props {
    style: object;
    type: string;
    children: any;
}

const Card_Component = (props: Card_Component_props) => {
    let frag;
    const rd_error = <antd.Result status="error" title="Failed Gathering, reload the page" />
    const rd_loading = <Icons.LoadingOutlined spin />
  
    if (props.type == "error") frag = (rd_error)
    if (props.type == "skeleton") frag = (rd_loading)
    if (!props.type) frag = (props.children)
  
    return(
      <div {...props} style={props.style} className={styles.render_component}>
        {frag}
      </div>
    )
}

Card_Component.defaultProps = {
    style: null,
    type: null,
    children: <h3>Empty</h3>
}

export default Card_Component