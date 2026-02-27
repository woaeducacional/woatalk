import "dotenv/config"
import express from "express"
import communityRoutes from "./routes/community.routes"

const app = express()

app.use(express.json())

app.get("/ping", (req, res) => {
  res.send("pong")
})

app.use(communityRoutes)

export default app