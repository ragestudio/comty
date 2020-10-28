# Callback Codes

## 000 - 100 > Runtime 

| code | type |
|--|--|
|  |  |


## 100 - 200 > Operations results

| code | type | description
|--|--|--|
| 100 | successful operation | |
| 110 | failed operation | unhandled |
| 115 | invalid operation | |
> API/WS Requests callbacks codes

| | | |
|--|--|--|
| 130 | needs auth | |
| 131 | no user send | |
| 132 | no id_user send | |
| 133 | no password send | |
| 134 | no token send | |
| 135 | no server_key send | |
| 136 | no payload send | |
> API/WS Invalid requests

| | | |
|--|--|--|
| 140 | invalid auth |
| 141 | invalid/notfound user |
| 142 | invalid/notfound id_user |
| 143 | invalid password |
| 144 | invalid/notfound token |
| 145 | invalid server_key | fails when the sended server_key is not valid |
| 146 | invalid payload | bad typeof / missing parameter / bad parameter |

## 200 - 300 > Permissions
