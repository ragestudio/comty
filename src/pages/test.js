import React from 'react'

export default class Render extends React.Component {
    state = {
        style: { textAlign: "center" }
    } 
    
    render(){
        const { style } = this.state
        const cambiarColor = (color) => { this.setState({ style: { color: color, ...style } }) }
        return(
            <div style={style} >
                Current Style => { JSON.stringify(style) }<br />
                <button onClick={() => { cambiarColor("green") }} > Update estilo </button>
            </div>
        )
    }
}   
