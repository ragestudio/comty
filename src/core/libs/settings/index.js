import { defaults, app_config } from 'config'
import { get_value } from '../../../pages/[page]/node_modules/core'

export function parseLocalStorage(){
    const a = localStorage.getItem(app_config.app_settings_storage)
    try {
        return JSON.parse(a)
    } catch (error) {
        console.log(error)
    }
}
export function newSetting(key, value) {
    let setting = {}
    setting.id = key
    setting.value = value
    return [setting]
}

export const settings = {
    get: (key) => {
        let tmp = [];

        const keys = Object.keys(defaults)
        const values = Object.values(defaults)
        const length = keys.length
    
        for (let i = 0; i < length; i++) {
            if(parseLocalStorage()){
                const storagedValue = parseLocalStorage().find(item => {
                    return item.id === keys[i]
                })
                if (typeof(storagedValue) == 'undefined') {
                    tmp[keys[i]] = values[i]
                }else{
                    tmp[keys[i]] = storagedValue.value
                }
            }
            else{
                tmp[keys[i]] = values[i]
            }
        }
    
        if (key) {
            return tmp[key]
        }
    
        return tmp
    },
    set: (key, value) => {
        let tmp
        let data = parseLocalStorage()
    
        if (data) {
            const finded = data.find(element => {
                return element.id === key
            })
            if (!finded) {
                const parsed = data.concat(newSetting(key, value))
                tmp = parsed
            } else {
                const updated = data.map(element => {
                    return element.id === key? Object.assign(element, { value: value }) : element
                })
                tmp = updated
            }
        }else{
           tmp = newSetting(key, value)
        }
        data = tmp
        try {
            localStorage.setItem( app_config.app_settings_storage, JSON.stringify(data) )
        } catch (error) {
            console.log(error)
            return false
        }
    }
} 

export default (e) => settings.get(e)