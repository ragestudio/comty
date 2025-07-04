import MusicModel from "@models/music"

export default {
	like: async (ctx, track) => {
		await MusicModel.toggleItemFavourite("track", track._id, true)

		ctx.changeState({
			liked: true,
		})
		ctx.close()
	},
	unlike: async (ctx, track) => {
		await MusicModel.toggleItemFavourite("track", track._id, false)

		ctx.changeState({
			liked: false,
		})
		ctx.close()
	},
	add_to_playlist: async (ctx, track) => {},
	add_to_queue: async (ctx, track) => {
		await app.cores.player.queue.add(track)
	},
	play_next: async (ctx, track) => {
		await app.cores.player.queue.add(track, { next: true })
	},
	copy_id: (ctx, track) => {
		console.log("copy_id", track)
		navigator.clipboard.writeText(track._id)
	},
}
