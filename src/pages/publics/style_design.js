import React from 'react'
import config from 'config'


export default class PAGE_PUBLIC extends React.Component{
    render(){
        return(
            <div>
                <img src={config.DarkFullLogoPath} /> <h1>Style Design</h1>
            </div>
        )
    }
}