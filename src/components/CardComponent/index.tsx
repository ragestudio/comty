import * as React from 'react'
import * as antd from 'antd'
import { LoadingOutlined } from 'components/Icons'

interface CardComponent_props {
    style: object;
    type: string;
    children: any;
}

const CardComponent = (props: CardComponent_props) => {
    let frag;
    const rd_error = <antd.Result status="error" title="Failed Gathering, reload the page" />
    const rd_loading = <LoadingOutlined spin />
  
    if (props.type == "error") frag = (rd_error)
    if (props.type == "skeleton") frag = (rd_loading)
    if (!props.type) frag = (props.children)
  
    return(
      <div {...props} style={props.style} className="cardComponent_wrapper">
        {frag}
      </div>
    )
}

CardComponent.defaultProps = {
    style: null,
    type: null,
    children: <h3>Empty</h3>
}

export default CardComponent