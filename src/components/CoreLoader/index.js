import React from 'react'
import style from './styles.less'
class CoreLoader extends React.PureComponent {
    render(){
        const { type } = this.props;
        if ( type == 'circle') {
            return (
                <div>
                    <div className={style.loader}>
                        <svg viewBox="0 0 80 80">
                            <circle id="test" cx="40" cy="40" r="32"></circle>
                        </svg>
                    </div>
                </div>
            );
        }
        if ( type == 'box') {
            return(
                <div>
                    <div className={style.loader}>
                        <svg viewBox="0 0 80 80">
                            <rect x="8" y="8" width="64" height="64"></rect>
                        </svg>
                    </div>
                </div>
            )
        }
       return null;
    }
}
export default CoreLoader;