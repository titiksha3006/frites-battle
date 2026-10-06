const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 8080;

const pool = new Pool({
  connectionString: process.env.POSTGRESQL_ADDON_URI,
  ssl: process.env.POSTGRESQL_ADDON_URI
    ? { rejectUnauthorized: false }
    : false
});

app.use(express.json());
app.use(express.static("public"));

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      sauce VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

app.get("/api/results", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sauce, COUNT(*)::int AS votes
      FROM votes
      GROUP BY sauce
      ORDER BY votes DESC, sauce
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/vote", async (req, res) => {
  const sauces = [
    "Andalouse",
    "Samouraï",
    "Mayonnaise",
    "Tartare",
    "Stoofvleessaus"
  ];

  if (!sauces.includes(req.body.sauce)) {
    return res.status(400).json({ error: "Invalid sauce" });
  }

  try {
    await pool.query(
      "INSERT INTO votes (sauce) VALUES ($1)",
      [req.body.sauce]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

initDb()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log("🍟 Frites Battle is running!");
    });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
