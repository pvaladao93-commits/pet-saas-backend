require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require("./config/db");
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
app.use(express.json());

/* ================= AUTH ================= */

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ erro: "Sem token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erro: "Token inválido" });
  }
}

/* ================= LOGIN ================= */

app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const user = await db.query("SELECT * FROM usuarios WHERE email=$1", [email]);

  if (!user.rows.length) return res.status(400).json({ erro: "Usuário não encontrado" });

  const valid = await bcrypt.compare(senha, user.rows[0].senha);

  if (!valid) return res.status(400).json({ erro: "Senha inválida" });

  const token = jwt.sign(user.rows[0], process.env.JWT_SECRET);

  res.json({ token });
});

/* ================= PETS ================= */

app.get("/pets", auth, async (req, res) => {
  const pets = await db.query(
    "SELECT * FROM pets WHERE empresa_id=$1",
    [req.user.empresa_id]
  );
  res.json(pets.rows);
});

app.post("/pets", auth, async (req, res) => {
  const { nome } = req.body;

  await db.query(
    "INSERT INTO pets (nome, empresa_id) VALUES ($1,$2)",
    [nome, req.user.empresa_id]
  );

  res.json({ ok: true });
});

/* ================= AGENDA ================= */

app.get("/agenda", auth, async (req, res) => {
  const dados = await db.query(
    "SELECT * FROM agenda WHERE empresa_id=$1",
    [req.user.empresa_id]
  );

  res.json(dados.rows);
});

app.post("/agenda", auth, async (req, res) => {
  const { data, tipo, pet_id } = req.body;

  await db.query(
    "INSERT INTO agenda (data, tipo, pet_id, empresa_id) VALUES ($1,$2,$3,$4)",
    [data, tipo, pet_id, req.user.empresa_id]
  );

  res.json({ ok: true });
});

/* ================= DASHBOARD ================= */

app.get("/dashboard", auth, async (req, res) => {
  const empresa = req.user.empresa_id;

  const fat = await db.query(
    "SELECT SUM(valor) FROM lancamentos WHERE tipo='entrada' AND empresa_id=$1",
    [empresa]
  );

  res.json({
    faturamento: fat.rows[0].sum || 0
  });
});

/* ================= PDF ================= */

app.get("/pdf", auth, (req, res) => {
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);
  doc.text("Relatório PetShop");
  doc.text("Assinatura: ____________");
  doc.end();
});

/* ================= START ================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando"));
