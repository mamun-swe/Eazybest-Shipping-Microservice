
const express = require("express")
const cors = require("cors")
const moragn = require("morgan")
const nocache = require("nocache")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const compression = require("compression")
require("dotenv").config()

const route = require("./api/routes")

const app = express()
app.use(compression())
app.use(cors())
app.use(moragn("dev"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(nocache())

app.use("/api/shipping/v1", route)

app.get('/', (req, res) => {
    res.send("WOW! Shipping Microservice. 😛😛😛")
})

app.use((error, req, res, next) => {
    if (error.status == 404) {
        return res.status(404).json({
            message: error.message
        })
    }

    if (error.status == 400) {
        return res.status(400).json({
            message: "Bad request."
        })
    }

    if (error.status == 401) {
        return res.status(401).json({
            message: "You have no permission."
        })
    }

    return res.status(500).json({
        message: "Something going wrong."
    })
})

// DB Connection here
mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false
})
    .then(() => console.log("Database connected"))
    .catch(error => {
        if (error) console.log("Database connection failed")
    })

// App Port
const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log(`App running on ${port} port`)
})
