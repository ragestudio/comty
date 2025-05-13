---
sidebar_position: 9
---

# Update a post
Updates a post with the given post ID and update payload.

Only can update your own posts.

<div class="divider"/>
<br />
```js
async function PostModel.update(post_id, payload)
```

### [String] post_id
Defines the ID of the post to update.

### [Object] Payload
| Parameter | Type | Optional | Default | Description |
| --- | --- | --- | --- | --- |
| message | String | false | undefined | The message of the post |
| attachments | Array | true | [] | A list of attachments |

<div class="divider"/>

### Success Response
| Parameter | Type | Content |
| --- | --- | --- |
| data | Object | [post-object](/docs/comty-js/definitions/post-object) |

<div class="divider"/>

## Examples
### Basic usage
```js
const post = await PostModel.update({
    post_id: "0000",
    message: "Updated message",
})

console.log(post)

// result: {
//  _id_: "0000",
//  message: "Updated message",
//  timestamp: "2024-01-01T17:00:00.000Z",
// }

```

### Modify or remove attachments
```js
const post = await PostModel.update({
    post_id: "0000",
    attachments: [
        {
            url: "https://upload.wikimedia.org/wikipedia/commons/3/30/Vulpes_vulpes_ssp_fulvus.jpg",
        }
    ],
})

console.log(post)

// result: {
//  _id_: "0000",
//  message: "Updated message",
//  timestamp: "2024-01-01T17:00:00.000Z",
//  attachments: [
//    {
//      url: "https://upload.wikimedia.org/wikipedia/commons/3/30/Vulpes_vulpes_ssp_fulvus.jpg",
//    } 
//  ]
// }

```