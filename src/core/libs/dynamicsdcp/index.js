import localforage from 'localforage'
import { package_json } from 'core'

// Dynamic secure data container processor
export class DynamicSDCP {
    constructor(props){
        if(props){
            this.props = props
        }
        this.instanceConfig = {
            name: props.name? props.name : `dynamicSDCP_${Math.random().toFixed()}`,
            driver      : localforage.WEBSQL, // Force WebSQL; same as using setDriver()
            version     : 1.0,
            size        : 4980736, // Size of database, in bytes. WebSQL-only for now.
            storeName   : package_json.UUID, // Should be alphanumeric, with underscores.
        }
        
        localforage.config(this.instanceConfig)
        this.instance = localforage.createInstance(this.instanceConfig)
    }
    useInstance(){
        console.log('Using ', this.instance)
    }
}

