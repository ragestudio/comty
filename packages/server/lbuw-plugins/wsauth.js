function OnWebsocketConnection({ Ctx }) {
	if (Ctx.Token) {
		const res = net.fetch({
			ServiceSocket: "users",
			Method: "GET",
			Url: "/users/self",
			Headers: {
				Authorization: `Bearer ${Ctx.Token}`,
			},
		})

		if (res.Body) {
			Ctx.Meta["user"] = res.Body
		}
	}
}

function OnWebsocketDisconnection({ Ctx }) {
	if (Ctx.Meta["username"]) {
		console.log(`This guy sucks -> @${Ctx.Meta["username"]}`)
	}
}

gateway.websockets.registerInternalEvent("connection", OnWebsocketConnection)
gateway.websockets.registerInternalEvent(
	"disconnection",
	OnWebsocketDisconnection,
)
