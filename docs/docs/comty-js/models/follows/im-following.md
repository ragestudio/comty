---
sidebar_position: 1
---

# Get followers
Retrieves the list of followers for a given user.

<div class="divider"/>
<br />
```js
async function FollowsModel.getFollowers(user_id, fetchData)
```

### Arguments
| Parameter | Type | Optional | Default | Description |
| --- | --- | --- | --- | --- |
| user_id | String | false | | |
| fetchData | Boolean | true | false | If true, the response will contain an array of users data|
| limit | Number | true | 10 | Only if fetchData is true. Limit the number of followers to fetch |
| offset | Number | true | 0 | Only if fetchData is true. Offset the list of followers to fetch |

<div class="divider"/>

### Success Response
| Parameter | Type | Content |
| --- | --- | --- |

<div class="divider"/>

## Examples
### Basic usage
```js
const followers = await FollowsModel.getFollowers("0000")

console.log(followers)

// result: {
//  count: 10
// }
```

### Retrieve user data
```js
const followers = await FollowsModel.getFollowers("0000", true, 50, 0)

console.log(followers)

// result: {
//  count: 10
//  list: [
//    {
//      _id_: "0000",
//      username: "comty",
//    },
//    {
//      _id_: "0001",
//      username: "john",
//    },
//    ...
//  ]
// }
```