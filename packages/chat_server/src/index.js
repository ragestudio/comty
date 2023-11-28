import path from "path"
global.FORCE_ENV = "prod"
require(path.resolve(process.cwd(), "../../shared/lib/api_wrapper"))