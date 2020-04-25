import React from 'react'
import * as ycore from 'ycore'

export default class _temp01 extends React.PureComponent{
    state = {
        loading: true,
        ua: 'asd',
        nombre_de_usuario: ' Error ',
        estado_2: 'Algo'
    }

    componentDidMount(){
        const a = ycore.userData()
        const b = JSON.stringify(a)
        console.log(a)
        this.setState({  ua: b, nombre_de_usuario: 'GVASHDJH', loading: false })
        
    }

    render(){
        if(this.state.loading) return <h1>loading...</h1>
        return(
            <div>
                <h1> Hola de nuevo, {this.state.nombre_de_usuario} </h1><br/>
                Este es tu token:
                { this.state.ua }
            </div>
        )
    }
}
