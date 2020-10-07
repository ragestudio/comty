import React from 'react'
import settings from 'core/libs/settings'

const verbosity_enabled = settings('verbosity')
export default class Verbosity extends React.Component{
    render(){
        return(
            <div>
                verbosity => {verbosity_enabled ? "enabled" : "disabled"}
                
            </div>
        )
    }
}