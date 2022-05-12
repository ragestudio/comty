import { default as ConfigController } from "./ConfigController"
import { default as RolesController } from "./RolesController"
import { default as SessionController } from "./SessionController"
import { default as UserController } from "./UserController"
import { default as FilesController } from "./FilesController"
import { default as PublicController } from "./PublicController"
import { default as PostsController } from "./PostsController"
import { default as StreamingController } from "./StreamingController"

export default [
    PostsController,
    ConfigController,
    PublicController,
    RolesController,
    SessionController,
    UserController,
    FilesController,
    StreamingController,
]