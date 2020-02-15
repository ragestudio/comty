import {DevOptions} from 'ycore'

export function CurrentTheme(){
   try {
    const bundle = localStorage.getItem('resource_bundle') || DevOptions.resource_bundle
    console.log('Loading resource Bundle =>', bundle)
    return bundle
   } catch (error) {
       return null
   }
}