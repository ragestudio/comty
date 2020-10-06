import { uri_resolver } from 'api/lib'
import io from 'socket.io-client'
import { connect } from 'umi'
import settings from 'core/libs/settings'

@connect(({ app }) => ({ app }))
export default class SocketConnection{
    state = {
        model: settings("app_model"),
        resolvers: this.props.app.resolvers
    }
    constructor(){
        console.log(model)
        this.opts = {

        }        
    }

    conn = {
        create: () => {

        },
        destroy: () => {

        }
    }

}

