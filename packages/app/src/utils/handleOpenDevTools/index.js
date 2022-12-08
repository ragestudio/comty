export default () => {
    var devtools = function () { }

    devtools.toString = function () {
        console.log(
            "%cStop!\n",
            "color: red; font-size: 40px; font-weight: bold;",
        )

        console.log(
            `%cYou have opened the devtools. This is a browser feature intended for developers. If someone told you to copy and paste something here to enable a feature or "hack" someone's account, it is a scam and will give them access to your account and data.`,
            "color: black; font-size: 20px; font-weight: bold;"
        )
    }

    console.log('%c', devtools)
}