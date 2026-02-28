import "dotenv/config";
import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.status(200).send("WOA Talk is live ✅");
});

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

export default app;