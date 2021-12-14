
// E-mail validator 
const isEmail = email => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email)
}

// BD phone number validator 
const isPhone = phone => {
    const regex = /^(?:\+88|88)?(01[3-9]\d{8})$/i
    return regex.test(phone)
}

// Empty value check
const isEmpty = data => {
    return (data == null || data === '' || data.length === 0)
}

module.exports = { isEmail, isPhone, isEmpty }