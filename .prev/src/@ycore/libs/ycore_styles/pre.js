import {AppSettings} from 'ycore'

export function CurrentTheme(){
   try {
    const bundle = localStorage.getItem('resource_bundle') || AppSettings.resource_bundle
    console.log('Loading resource Bundle =>', bundle)
    return bundle
   } catch (error) {
       return null
   }
}