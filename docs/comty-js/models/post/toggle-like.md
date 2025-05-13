---
sidebar_position: 6
---

# Toggle post like
Toggles the like status of a post.

<div class="divider"/>
<br />
```js
async function PostModel.toggleLike(payload)
```

### [Object] Payload
| Parameter | Type | Optional | Default | Description |
| --- | --- | --- | --- | --- |
| post_id | string | false |  |  |
| to | Boolean | true |  | Set like to true or false |

<div class="divider"/>

### Success Response
| Parameter | Type | Content |
| --- | --- | --- |
| data | Object | [like-status-object](/docs/comty-js/definitions/like-status-object) |

<div class="divider"/>

## Examples
### Basic usage
```js
const like = await PostModel.toggleLike({
    post_id: "0000",
})

console.log(like)

// result: {
//  post_id: "0000",
//  liked: true,
//  count: 1,
// }

```
### Specify status
```js
const like = await PostModel.toggleLike({
    post_id: "0000",
    to: false
})

console.log(like)

// result: {
//  post_id: "0000",
//  liked: false,
//  count: 0,
// }

```