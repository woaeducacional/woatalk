import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.get("/", (req, res) => {
  res.status(200).send("WOA Talk API online ✅");
});

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// Porta
const PORT = Number(process.env.PORT) || 3000;

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});