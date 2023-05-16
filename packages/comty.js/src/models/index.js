import AuthModel from "./auth"
import FeedModel from "./feed"
import FollowsModel from "./follows"
import LivestreamModel from "./livestream"
import PlaylistsModel from "./playlists"
import PostModel from "./post"
import SessionModel from "./session"
import SyncModel from "./sync"
import UserModel from "./user"

function getEndpointsFromModel(model) {
    return Object.entries(model).reduce((acc, [key, value]) => {
        acc[key] = value

        return acc
    }, {})
}

function createHandlers() {
    return {
        auth: getEndpointsFromModel(AuthModel),
        feed: getEndpointsFromModel(FeedModel),
        follows: getEndpointsFromModel(FollowsModel),
        livestream: getEndpointsFromModel(LivestreamModel),
        playlists: getEndpointsFromModel(PlaylistsModel),
        post: getEndpointsFromModel(PostModel),
        session: getEndpointsFromModel(SessionModel),
        sync: getEndpointsFromModel(SyncModel),
        user: getEndpointsFromModel(UserModel),
    }
}

export {
    AuthModel,
    FeedModel,
    FollowsModel,
    LivestreamModel,
    PlaylistsModel,
    PostModel,
    SessionModel,
    SyncModel,
    UserModel,
    createHandlers,
}
