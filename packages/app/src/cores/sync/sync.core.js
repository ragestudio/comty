import React from "react"

import Core from "evite/src/core"
import EventEmitter from "evite/src/internals/eventBus"

import SyncRoomCard from "components/SyncRoomCard"
import Image from "components/Image"
import { openModal as OpenUserSelectorModal } from "components/UserSelector"

import SyncModel from "comty.js/models/sync"

// TODO: Sync current state with server
class MusicSyncSubCore {
    constructor(ctx) {
        this.ctx = ctx
    }

    static namespace = "music"

    musicWs = null

    currentRoomData = null

    eventBus = new EventEmitter()

    public = {
        joinRoom: this.joinRoom.bind(this),
        leaveRoom: this.leaveRoom.bind(this),
        dispatchEvent: this.dispatchEvent.bind(this),
        inviteToUser: this.inviteToUser.bind(this),
        createSyncRoom: this.createSyncRoom.bind(this),
        createInviteUserModal: this.createInviteUserModal.bind(this),
        currentRoomData: function () {
            return this.currentRoomData
        }.bind(this),
        eventBus: this.eventBus,
        moderation: {
            kickUser: this.kickUser.bind(this),
            transferOwner: this.transferOwner.bind(this),
        },
    }

    hubEvents = {
        "invite:received": (data) => {
            this.console.log("invite:received", data)

            app.cores.notifications.new({
                title: "Sync",
                description: `${data.invitedBy.username} invited you to join a sync room`,
                icon: React.createElement(Image, {
                    src: data.invitedBy.avatar,
                }),
            }, {
                type: "info",
                duration: 10000,
                actions: [{
                    label: "Join",
                    onClick: () => {
                        this.joinRoom(data.roomId)
                    }
                }]
            })
        },
        "room:joined": (data) => {
            this.console.log("room:joined", data)

            this.currentRoomData = data

            // check if user is owner
            app.cores.player.toggleSyncMode(true, data.ownerUserId !== app.userData._id)

            this.startSendStateInterval()

            this.eventBus.emit("room:joined", data)
        },
        "room:left": (data) => {
            this.console.log("room:left", data)

            this.dettachCard()

            this.currentRoomData = null

            app.cores.player.toggleSyncMode(false, false)

            this.eventBus.emit("room:left", data)
        },
    }

    roomEvents = {
        "disconnect": () => {
            this.dettachCard()
            this.currentRoomData = null

            app.cores.notifications.new({
                title: "Sync",
                description: "Disconnected from sync server"
            }, {
                type: "error",
            })

            app.cores.player.toggleSyncMode(false, false)
        },

        "room:user:joined": (data) => {
            this.eventBus.emit("room:user:joined", data)
        },
        "room:user:left": (data) => {
            this.eventBus.emit("room:user:left", data)
        },
        "room:current-data": (data) => {
            this.console.log("room:current-data", data)
            this.currentRoomData = data

            this.eventBus.emit("room:current-data", data)
        },
        "room:owner:changed": (data) => {
            const isSelf = data.ownerUserId === app.userData._id

            app.cores.player.toggleSyncMode(true, !isSelf)

            app.cores.player.playback.stop()

            this.eventBus.emit("room:owner:changed", data)
        },
        // Room Control
        "music:player:state": (data) => {
            if (data.command_issuer === app.userData._id) {
                return false
            }

            this.eventBus.emit("music:player:start", data)

            app.cores.player.start(data.manifest, {
                sync: true,
                time: data.time,
            })
        },
        "music:player:seek": (data) => {
            if (data.command_issuer === app.userData._id) {
                return false
            }

            this.eventBus.emit("music:player:seek", data)

            app.cores.player.seek(data.position, {
                sync: true,
            })
        },
        "music:player:status": (data) => {
            if (data.command_issuer === app.userData._id) {
                return false
            }

            // avoid dispatch if event pause and current time is the audio duration
            if (data.startingNew || data.status === "paused" && data.time === data.duration) {
                //return app.cores.player.playback.stop()
                return false
            }

            switch (data.status) {
                case "playing": {
                    app.cores.player.playback.play()
                    break
                }
                case "paused": {
                    app.cores.player.playback.pause()
                    break
                }
            }
        },
        "room:moderation:kicked": (data) => {
            this.console.log("room:moderation:kicked", data)

            this.dettachCard()

            this.currentRoomData = null

            app.cores.player.toggleSyncMode(false, false)

            app.cores.notifications.new({
                title: "Kicked",
                description: "You have been kicked from the sync room"
            }, {
                type: "error",
            })

            this.eventBus.emit("room:moderation:kicked", data)
        },
    }

    async onInitialize() {
        this.musicWs = this.ctx.CORES.api.instance.sockets.music

        Object.keys(this.hubEvents).forEach((eventName) => {
            this.musicWs.on(eventName, this.hubEvents[eventName])
        })
    }

    startSendStateInterval() {
        if (this.sendStateInterval) {
            clearInterval(this.sendStateInterval)
        }

        this.firstStateSent = true

        this.sendStateInterval = setInterval(() => {
            if (!this.currentRoomData) {
                return false
            }

            let state = app.cores.player.currentState()

            this.console.log("state", state)

            this.musicWs.emit("music:state:update", {
                ...state,
                firstSync: this.firstStateSent
            })

            if (this.firstStateSent) {
                this.firstStateSent = false
            }
        }, 2000)
    }

    dispatchEvent(eventName, data) {
        if (!eventName || !this.currentRoomData) {
            return false
        }

        this.musicWs.emit(eventName, data)
    }

    attachCard() {
        if (this.syncRoomCardRendered) {
            return false
        }

        if (!app.layout.floatingStack) {
            this.console.error("Floating stack not found")
            return false
        }

        this.syncRoomCardRendered = app.layout.floatingStack.add("sync-room-card", SyncRoomCard)
    }

    dettachCard() {
        if (!this.syncRoomCardRendered) {
            return false
        }

        if (!app.layout.floatingStack) {
            this.console.error("Floating stack not found")
            return false
        }

        app.layout.floatingStack.remove("sync-room-card")

        this.syncRoomCardRendered = null
    }

    joinRoom(roomId, options) {
        if (this.currentRoomData) {
            this.console.warn(`Already joined room ${this.currentRoomData}`)

            return false
        }

        this.attachCard()

        this.musicWs.emit("join:room", {
            room: roomId,
            options
        })

        Object.keys(this.roomEvents).forEach((eventName) => {
            this.musicWs.on(eventName, this.roomEvents[eventName])
        })
    }

    leaveRoom(roomId) {
        this.dettachCard()

        if (!roomId && !this.currentRoomData) {
            this.console.warn(`Not joined any room`)

            return false
        }

        if (!roomId) {
            roomId = this.currentRoomData.roomId
        }

        this.musicWs.emit("leave:room", {
            room: roomId
        })

        this.currentRoomData = null

        if (this.sendStateInterval) {
            this.firstStateSent = false
            clearInterval(this.sendStateInterval)
        }

        Object.keys(this.roomEvents).forEach((eventName) => {
            this.musicWs.off(eventName, this.roomEvents[eventName])
        })
    }

    inviteToUser(userId) {
        if (!this.currentRoomData) {
            this.console.warn(`Not joined any room`)

            return false
        }

        this.musicWs.emit("invite:user", {
            roomId: this.currentRoomData.roomId,
            user_id: userId,
        })
    }

    createSyncRoom() {
        if (this.currentRoomData) {
            this.console.warn(`Already joined room ${this.currentRoomData}`)

            return false
        }

        this.joinRoom(`${app.userData._id}_${Date.now()}`, {
            title: `${app.userData.username}'s room`,
        })

        this.createInviteUserModal()
    }

    createInviteUserModal() {
        //open invite modal
        OpenUserSelectorModal({
            onFinished: (selected_ids) => {
                this.console.log("selected_ids", selected_ids)
            }
        })
    }

    kickUser(userId) {
        if (!this.currentRoomData) {
            this.console.warn(`Not joined any room`)

            return false
        }

        this.musicWs.emit("room:moderation:kick", {
            room_id: this.currentRoomData.roomId,
            user_id: userId,
        })
    }

    transferOwner(userId) {
        if (!this.currentRoomData) {
            this.console.warn(`Not joined any room`)

            return false
        }

        this.musicWs.emit("room:moderation:transfer_ownership", {
            room_id: this.currentRoomData.roomId,
            user_id: userId,
        })
    }
}

export default class SyncCore extends Core {
    static disabled = true
    static namespace = "sync"
    static dependencies = ["api", "player"]

    activeLinkedServices = {}

    public = {
        getActiveLinkedServices: function () {
            return this.activeLinkedServices
        }.bind(this),
    }

    events = {
        "app.initialization.start": async () => {
            const activeServices = await SyncModel.getLinkedServices().catch((error) => {
                this.console.error(error)
                return null
            })

            if (activeServices) {
                this.console.log(`Active services`, activeServices)
                this.activeLinkedServices = activeServices
            }
        }
    }

    async onInitialize() {
        for (const [key, value] of Object.entries(this.events)) {
            app.eventBus.on(key, value)
        }

        const subCores = [
            new MusicSyncSubCore(this.ctx)
        ]

        for await (const subCore of subCores) {
            try {
                if (typeof subCore.onInitialize === "function") {
                    await subCore.onInitialize()
                }

                if (subCore.constructor.namespace && subCore.public) {
                    this.public[subCore.constructor.namespace] = subCore.public
                }
            } catch (error) {
                this.console.error(error)
            }
        }
    }

    // async initializeAfterCoresInit() {
    // }
}