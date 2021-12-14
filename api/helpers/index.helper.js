
// Extract route group name
const RouteGroupName = path => {
    return path.replace(/\//g, " ").split(" ")[1]
}

module.exports = {
    RouteGroupName
}