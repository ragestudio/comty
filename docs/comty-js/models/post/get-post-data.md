---
sidebar_position: 4
---

# Get post data
Retrieves the data of a post.

<div class="divider"/>
<br />
```js
async function PostModel.post(payload)
```

### [Object] Payload
| Parameter | Type | Optional | Default | Description |
| --- | --- | --- | --- | --- |
| post_id | string | false |  | Defines the ID of the post to retrieve.|

<div class="divider"/>

### Success Response
| Parameter | Type | Content |
| --- | --- | --- |
| data | object | [post_obj](/docs/comty-js/definitions/post-object) |

<div class="divider"/>

## Examples
### Basic usage
```js
const post = await PostModel.post({
    post_id: "0000",
})

console.log(post)

// result: { 
//   _id: "0000", 
//   user_id: "0000", 
//   message: "example text",
//   ...
// }

```