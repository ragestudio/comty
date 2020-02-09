import React, { Component } from 'react';
import { Icon as LegacyIcon } from '@ant-design/compatible';
import styles from '../yid.scss';

import PropTypes from 'prop-types';

class StatusBox extends Component {
    
    constructor(props){
        super(props)
        this.state = {
            Reactive: 'loading',
        }
    }
    componentDidMount(){
        const { StateCode } = this.props;
        this.setState({Reactive: StateCode });
    }
    render(){
        const { Reactive } = this.state;
       
        if (Reactive == 'loading') {
            return (
              <div className={styles.spinner__wrapper} id="loadingspn" >
                <div><LegacyIcon type="loading" style={{ fontSize: 24, margin: '13px' }} spin /></div>
                <div>
                  <br /><br /><br />
                  <div style={{ margin: 'auto' }}><h6 className={styles.h6lp} style={{ textAlign: 'center', marginTop: '15%' }}>Wait a sec...</h6></div>
                </div>
              </div>
            );
        }
        if (Reactive == '200') {
            return (
              <div className={styles.spinner__wrapper} id="loadingspn" >
                <div>
                  <br /><br /><br />
                  <div style={{ margin: 'auto' }}><h6 className={styles.h6lp} style={{ textAlign: 'center', marginTop: '15%' }}>SI</h6></div>
                </div>
              </div>
            )
           }
        if (Reactive == '400') {
          return (
            <div className={styles.spinner__wrapper} id="loadingspn" >
              <div>
                <br /><br /><br />
                <div style={{ margin: 'auto' }}><h6 className={styles.h6lp} style={{ textAlign: 'center', marginTop: '15%' }}>NO</h6></div>
              </div>
            </div>
          )
         }

        return null
    }
}

StatusBox.propTypes = {
    handleStatus: PropTypes.func,
    Loading: PropTypes.bool,
    StateCode: PropTypes.string
}

export default StatusBox;