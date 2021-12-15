const express = require("express")
const router = express.Router()
const Permission = require("../middleware/permission.middleware")
const { ListRouter } = require("./list.route")
const { AdminRouter } = require("./admin.route")

// Admin routes
router.use("/list", ListRouter)
router.use("/admin", Permission.Admin, AdminRouter)

module.exports = router