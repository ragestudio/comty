import * as app from 'app'

// REDUCERS, USERPROFILE
export const get = {
    followers: (callback,id) => {
        const payload = { user_id: id }
        app.comty_user.getFollowers((err,res) => {
           try {
            const a = JSON.parse(res)['followers']
            callback(a)
            return false
           } catch (error) {
             callback(false)
             return false
           }
        }, payload)
    },
}