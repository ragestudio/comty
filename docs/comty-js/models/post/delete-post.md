---
sidebar_position: 10
---

# Delete a post
Delete a post with the given post ID.

Only can delete your own posts.

<div class="divider"/>
<br />
```js
async function PostModel.delete(payload)
```

### [Object] Payload
| Parameter | Type | Optional | Default | Description |
| --- | --- | --- | --- | --- |
| post_id | String | false | undefined |  |

<div class="divider"/>

### Success Response
| Parameter | Type | Content |
| --- | --- | --- |
| post_id | String |  |
| deleted | Boolean |  |

<div class="divider"/>

## Examples
### Basic usage
```js
const post = await PostModel.delete({
    post_id: "0000",
})

console.log(post)

// result: {
//  post_id: "0000",
//  deleted: true,
// }

```