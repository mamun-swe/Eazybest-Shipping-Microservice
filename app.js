
const express = require("express")
const cors = require("cors")
const moragn = require("morgan")
const nocache = require("nocache")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const compression = require("compression")
const cluster = require("cluster")
const process = require("process")
const { cpus } = require("os")
require("dotenv").config()

const numCPUs = cpus().length
const route = require("./api/routes")

if (cluster.isMaster) {
    console.log(`Primary ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
} else {
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
}