import React from 'react'
import * as ycore from 'ycore'
import * as antd from 'antd'
import styles from './index.less'
import Radium, {StyleRoot}from 'radium';
import { fadeInUp, bounceOutDown } from 'react-animations'

const animationStyles = {
    fadeInUp: {
        animation: 'x 0.5s',
        animationName: Radium.keyframes(fadeInUp, 'fadeInUp')
    },
    bounceOutDown: {
        animation: 'x 1s',
        animationName: Radium.keyframes(bounceOutDown, 'bounceOutDown')
    }
}

export function HandleShow(){
    window.MicroHeaderComponent.toogleShow();
    return
}
class MicroHeader extends React.Component {
    constructor(props){
        super(props),
        window.MicroHeaderComponent = this;
        this.state = {
            FadeIN: true,
            Show: false
        }
    }
    toogleShow(){
        this.setState({FadeIN: !this.state.FadeIN})
        this.state.FadeIN? this.setState({ Show: true }) : setTimeout(() => this.setState({ Show: false }), 1000)
    }
    render(){
        const { FadeIN, Show } = this.state
        return(
            Show? (
            <StyleRoot>
                <div style={FadeIN? animationStyles.fadeInUp : animationStyles.bounceOutDown }>
                    <antd.Card bordered={false} className={styles.MicroHeader}> 
                      <React.Fragment>
                          <span>Gatitos el gai</span>
                      </React.Fragment> 
                    </antd.Card>
                </div>
            </StyleRoot>
            ) : null
        )
    }
}
export default MicroHeader