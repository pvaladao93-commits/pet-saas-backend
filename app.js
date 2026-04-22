require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());

// TESTE
app.get("/", (req, res) => {
  res.send("API rodando 🚀");
});

// TESTE BANCO
app.get("/teste-db", async (req, res) => {
  const result = await db.query("SELECT NOW()");
  res.json(result.rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando"));