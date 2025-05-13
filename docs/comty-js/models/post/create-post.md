---
sidebar_position: 8
---

# Create a post
Creates a new post with the given payload.

<div class="divider"/>
<br />
```js
async function PostModel.create(payload)
```

### [Object] Payload
| Parameter | Type | Optional | Default | Description |
| --- | --- | --- | --- | --- |
| message | String | false | undefined | The message of the post |
| attachments | Array | true | [] | A list of attachments |
| timestamp | String | true | DateTime.local().toISO() |  |
| reply_to | String | true | null |  |

<div class="divider"/>

### Success Response
| Parameter | Type | Content |
| --- | --- | --- |
| data | Object | [post-object](/docs/comty-js/definitions/post-object) |

<div class="divider"/>

## Examples
### Basic usage
```js
const post = await PostModel.create({
    message: "Testing Comty.JS",
    timestamp: new Date(),
})

console.log(post)

// result: {
//  _id_: "0000",
//  message: "Testing Comty.JS",
//  timestamp: "2024-01-01T17:00:00.000Z",
// }

```

### Add attachments
```js
const post = await PostModel.create({
    message: "Look at this fox",
    attachments: [
        {
            url: "https://upload.wikimedia.org/wikipedia/commons/3/30/Vulpes_vulpes_ssp_fulvus.jpg",
        }
    ],
})

console.log(post)

// result: {
//  _id_: "0001",
//  message: "Look at this fox",
//  timestamp: "2024-01-01T17:00:00.000Z",
//  attachments: [
//    {
//      url: "https://upload.wikimedia.org/wikipedia/commons/3/30/Vulpes_vulpes_ssp_fulvus.jpg",
//    } 
//  ]
// }

```

### Reply to a post
```js
const post = await PostModel.create({
    reply_to: "0001",
    message: "* pet pet *",
})

console.log(post)

// result: {
//  _id_: "0002",
//  reply_to: "0001",
//  message: "* pat pat*",
//  timestamp: "2024-01-01T17:30:00.000Z",
// }

```