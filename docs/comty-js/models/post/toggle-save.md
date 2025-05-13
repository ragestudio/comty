---
sidebar_position: 7
---

# Toggle post save
Toggles the save status of a post.

<div class="divider"/>
<br />
```js
async function PostModel.toggleSave(payload)
```

### [Object] Payload
| Parameter | Type | Optional | Default | Description |
| --- | --- | --- | --- | --- |
| post_id | string | false |  |  |
| to | Boolean | true |  | Set save to true or false |

<div class="divider"/>

### Success Response
| Parameter | Type | Content |
| --- | --- | --- |
| data | Object | [save-status-object](/docs/comty-js/definitions/save-status-object) |

<div class="divider"/>

## Examples
### Basic usage
```js
const save = await PostModel.toggleSave({
    post_id: "0000",
})

console.log(save)

// result: {
//  post_id: "0000",
//  saved: true,
//  count: 1,
// }

```
### Specify status
```js
const save = await PostModel.toggleSave({
    post_id: "0000",
    to: false
})

console.log(save)

// result: {
//  post_id: "0000",
//  saved: false,
//  count: 0,
// }

```