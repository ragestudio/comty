import * as ycore from 'ycore'
import localforage from 'localforage'

export const asyncSDCP = {
    setSDCP: function (value) {
        return Promise.resolve().then(function () {
            localforage.setItem('SDCP', value)
        });
    },
    getRaw: () => {
        try {
            return localforage.getItem('SDCP');
        } catch (err) {
            return false
        }
    },
    get: (callback) => {
        try {
            const a = ycore.asyncSDCP.getRaw((err, value)=> {
                const b = ycore.CryptSDCP.atob_parse(value)
                return callback(null, b)
            })
        } catch (err) {
            return false
        }
    },
};

export function GetSDCPfromCloud(values, res) {
    const prefix = '[InitSDCP]';
    let payload = {};
    if (!values) {
        const message = 'Missing payload! Exception while request data...';
        ycore.yconsole.log(prefix, message)
        return;
    }
    payload.UserToken = values.UserToken;
    payload.UserID = values.UserID;
    if (payload) {
        ycore.GetUserData(payload, (err, response) => 
          { 
            let cooked = JSON.parse(response)['user_data']
            let Ensamblator = btoa(JSON.stringify(cooked))
            res(Ensamblator);
          }
        )
    }
}

export function UpdateSDCP() {
   const prefix = '[UpdateSDCP]';
   ycore.GetUserData(null, (err, response) => {
       let cooked = JSON.parse(response)['user_data']
       let Lsdcp = [atob(sessionStorage.getItem('SDCP'))];
       let Nsdcp = [JSON.stringify(cooked)]
       const e1 = btoa(Lsdcp)
       const e2 = btoa(Nsdcp)
       const n = e1.localeCompare(e2)
       if (!e2) {
            ycore.yconsole.log(prefix, 'API Returned empty response! We recommend to logout')
            return
       }
       if (e1 == e2) {
         ycore.yconsole.log(prefix, 'SDCP Equality')
       }else{
           ycore.yconsole.log(prefix, 'SDCP Update detected ! => ', n)
           ycore.yconsole.debug(`Compare versions =>  NEW ${[e1]} || OLD ${[e2]}  `)
           ycore.asyncSDCP.setSDCP(e2)
       }

   })
}

export function SDCP() {
   let a = ycore.asyncSDCP.get()
   if (a) {
     return a
   }
   return false
}

export const CryptSDCP = {
    atob_parse:  (e) => {
        if (e) {
            try {
                atob(e);
              } catch (err) {
                  ycore.notifyError(err)
                  ycore.router.push({pathname: '/login',})
                  return false
              }
            try {
                let decodedSDCP = atob(e);
                let parsedSDCP = JSON.parse(decodedSDCP);
                return parsedSDCP;
            } catch (err) {
                ycore.notifyError(err)  
                ycore.router.push({pathname: '/login',})
                return false
            }
        }
        return false
    },
    valid: () => {
        const a = ycore.asyncSDCP.get()
        return a? true : false
    }

}

export function SetupApp(){
    // TODO: Default sets
    ycore.notify.success('Authorised, please reload the app for login!')
    const resourceLoad = localStorage.getItem('resource_bundle')
    if (!resourceLoad) {
        localStorage.setItem('resource_bundle', 'light_ng')
    }
}