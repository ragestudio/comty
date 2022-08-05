import { User } from "../../../models"
import { createUser } from "../../../lib"

export default async () => {
    // check if any user with includes admin role exists
    const adminUser = await User.find({
        $or: [
            { roles: { $in: ['admin'] } },
        ],
    })

    // if no user with admin role exists, create one
    if (adminUser.length === 0) {
        console.log('Creating admin user...')

        await createUser({
            username: 'admin',
            password: 'admin',
            roles: ['admin'],
        })

        console.log('Admin user created!')
    }
}