import { defaults, app_config } from 'config'
import { get_value } from 'core'


export function parseLocalStorage(){
    const a = localStorage.getItem(app_config.app_settings_storage)
    try {
        return JSON.parse(a)
    } catch (error) {
        console.log(error)
    }
}

export function settingValue(key){
    let tmp = [];

    const keys = Object.keys(defaults)
    const values = Object.values(defaults)
    const length = keys.length

    for (let i = 0; i < length; i++) {
        const storagedValue = get_value(parseLocalStorage(), keys[i])
        tmp[keys[i]] = (storagedValue? storagedValue : values[i])
    }

    if (key) {
        return tmp[key]
    }

    return tmp
}

export const storage = {
    get: (key) => {
        return settingValue(key)
    },
    set: (key, value) => {
        const storaged = parseLocalStorage()
        const updated = storaged.map(element => {
            return element.id === key? Object.assign(element, { value: value }) : element
        });
        try {
            localStorage.setItem( app_config.app_settings_storage, JSON.stringify(updated) )
        } catch (error) {
            console.log(error)
        }
    }
} 

export default settingValue