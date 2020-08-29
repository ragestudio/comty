import React from 'react'
import themeStyle from 'theme/base/vars.less'

class AntdDebug extends React.Component{
    state = {
        styleLink: document.getElementById('theme-style'),
        body: document.getElementsByTagName('body')[0]
    }
    render(){
        return(
            <div>
                {JSON.stringify(themeStyle)}
            </div>
        )
    }
}
export default AntdDebug