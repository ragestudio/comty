import cookies from "js-cookie"

export default () => {
    window.localStorage.clear()
    window.sessionStorage.clear()

    // delete all cookies
    const allCookies = cookies.get()

    for (const cookieName in allCookies) {
        cookies.remove(cookieName)
    }

    location.reload()
}