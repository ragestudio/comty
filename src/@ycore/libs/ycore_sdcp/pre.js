import * as ycore from 'ycore'

export const asyncSDCP = {
    setSDCP: function (value) {
        return Promise.resolve().then(function () {
            sessionStorage.setItem('SDCP', value);
        });
    },
    getSDCP: function () {
        return sessionStorage.getItem('SDCP');
    }
};
export function InitSDCP(values, done) {
    const prefix = '[InitSDCP]';
    let payload = {};
    if (!values) {
        const message = 'Missing payload! Exception while request data...';
        ycore.DevOptions.ShowFunctionsLogs? console.log(prefix, message) : null
        return;
    }
    payload.UserToken = values.UserToken;
    payload.UserID = values.UserID;
    if (payload) {
        ycore.GetUserData(payload, (err, response) => 
          { 
            let cooked = JSON.parse(response)['user_data']
            let Ensamblator = btoa(JSON.stringify(cooked))
            ycore.asyncSDCP.setSDCP(Ensamblator).then(() => {
               ycore.DevOptions.ShowFunctionsLogs? console.log(prefix, ' SDCP Setup done') : null
               return done(true)
           })
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
            console.log(prefix, 'API Returned empty response! We recommend to logout')
            return
       }
       if (e1 == e2) {
           console.log(prefix, 'SDCP Equality')
       }else{
           ycore.DevOptions.ShowFunctionsLogs? console.log(prefix, 'SDCP Update detected ! => ', n) : null
           ycore.DevOptions.ShowFunctionsLogs? console.debug(`Compare versions =>  NEW ${[e1]} || OLD ${[e2]}  `) : null
           ycore.asyncSDCP.setSDCP(e2)
       }

   })
}
export function SDCP() {
   const prefix = '[SDCPCooker]';
   let SDCPContainer = sessionStorage.getItem('SDCP')
   if (SDCPContainer) {
       try {
         atob(SDCPContainer);
       } catch (err) {
           console.error(prefix, err)
           ycore.router.push({pathname: '/login',})
           return null
       }
       try {
           let decodedSDCP = atob(SDCPContainer);
           let parsedSDCP = JSON.parse(decodedSDCP);
           return parsedSDCP;
       } catch (err) {
           console.error(prefix, err)  
           ycore.router.push({pathname: '/login',})
           return null
       }
   }
}