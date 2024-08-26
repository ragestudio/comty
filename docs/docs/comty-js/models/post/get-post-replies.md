---
sidebar_position: 5
---

# Get post replies
Retrieves replies of a post.

<div class="divider"/>
<br />
```js
async function PostModel.replies(payload)
```

### [Object] Payload
| Parameter | Type | Optional | Default | Description |
| --- | --- | --- | --- | --- |
| post_id | string | false |  |  |
| trim | number | true | 0 | Trim the post index content |
| limit | number | true | 10 | Limit the number of posts to fetch |

<div class="divider"/>

### Success Response
| Parameter | Type | Content |
| --- | --- | --- |
| data | Array | [[post_obj](/docs/comty-js/definitions/post-object), ...] |

<div class="divider"/>

## Examples
### Basic usage
```js
const posts = await PostModel.replies({
    post_id: "0000",
    trim: 0,
    limit: 10,
})

console.log(posts)

// result: [
//   { _id: "0000", user_id: "0000", message: "example text", ... },
//   { _id: "0001", user_id: "0000", message: "example text", ... },
//   ...
// ]

```