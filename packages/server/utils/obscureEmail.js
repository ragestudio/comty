export default (str) => {
    const [name, domain] = str.split("@")

    return `${name[0]}${new Array(name.length).join("*")}@${domain}`
}
