import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import styles from './index.less'
import { HandleVisibility } from 'components/PostCreator'

export function HandleShow(){
    window.MicroHeaderComponent.toogleShow();
    return
}
class MicroHeader extends React.Component {
    constructor(props){
        super(props),
        window.MicroHeaderComponent = this;
        this.state = {
            FadeIN: false,
            Show: true
        }
    }
    toogleShow(){
        this.setState({FadeIN: !this.state.FadeIN})
        this.state.FadeIN? this.setState({ Show: true }) : setTimeout(() => this.setState({ Show: false }), 1000)
    }
    render(){
        const { Show } = this.state
        return(
            Show? (
                <div>
                    <antd.Card bordered={false} className={styles.MicroHeader}> 
                         <antd.Button icon="notification" />
                         <antd.Button icon="plus" onClick={() => HandleVisibility()} />
                         <antd.Button icon="filter" /> 
                    </antd.Card>
              
                </div>
            ) : null
        )
    }
}
export default MicroHeader