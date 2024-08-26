---
sidebar_position: 1
---

# Login (Credentials)
This method allows you to create a auth session with a username and password.

:::info
Use of [**server keys**](/docs/comty-js/authentication#server-keys) is recommended instead using credentials. 
:::

<div class="divider"/>

### Parameters
| Parameter | Type | Optional | Default | Description |
| --- | --- | --- | --- | --- |
| [payload](#object-payload) | Object | true |  |  |
| [callback](#function-callback) | Function | false |  |  |

#### [Object] Payload 
| Parameter | Type | Optional | Default | Description |
| --- | --- | --- | --- | --- |
| username | String | true |  |  |
| password | String | true |  |  |
| mfa_code | String | false |  | Required if MFA is enabled for this user |

#### [Function] Callback
Executed on successful login

| Parameter | Type | Content |
| --- | --- | --- | 
| data | Object | [Successful Auth](#successful-auth) |

#### [Object] Successful Auth
Contains the token and refresh token

| Parameter | Type | Content |
| --- | --- | --- |
| token | String |  |
| refreshToken | String |  |
| expires_in | String |  |


<div class="divider"/>

### Examples
Basic usage

```js
const auth = await AuthModel.login({
    username: "testuser",
    password: "testpassword",
})

console.log(auth)

// returns
// {
//    token: "xxxx",
//    refreshToken: "xxxx",
// }
```

Using Callback

```js
AuthModel.login({
    username: "testuser",
    password: "testpassword",
}, (data) => {
    console.log(data)
    
    // returns
    // {
    //    token: "xxxx",
    //    refreshToken: "xxxx",
    // }
})
```