
// Extract route group name
const RouteGroupName = path => {
    return path.replace(/\//g, " ").split(" ")[1]
}

// get hour & minute from time string
const GetHourMinute = time => {
    const split_time = time.split(":")
    return {
        hour: split_time[0],
        minute: split_time[1]
    }
}

// Date formate with AM/PM
const FormatDateWithAMPM = date => {
    date = new Date(date)
    const cdate = date.toDateString();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = cdate + ' ' + hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

module.exports = {
    RouteGroupName,
    GetHourMinute,
    FormatDateWithAMPM
}