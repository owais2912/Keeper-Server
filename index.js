import express from "express";
import env from "dotenv";
import pg from "pg";
import cors from "cors";

const app = express();
app.use(cors());
env.config();
const PORT = process.env.PORT;
const currentDate = new Date();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(express.json());

//Get List of Notes
app.get("/api/notes", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM notes WHERE deleted_at IS NULL ORDER BY id DESC"
  );
  res.send(result.rows);
});

// Add New Note
app.post("/api/add-note", async (req, res) => {
  try {
    const { title, content } = req.body;
    await db.query(
      "INSERT INTO notes (title, content, created_at, updated_at) VALUES($1, $2, $3, $4)",
      [title, content, currentDate.toISOString(), currentDate.toISOString()]
    );
    res.send("Successfully added");
  } catch (error) {
    res.send(error);
  }
});

//Delete Note
app.post("/api/delete-note/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query("SELECT * FROM notes WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).send(`Note with ID ${id} not found`);
    }
    const note = result.rows[0];
    if (note.deleted_at === null) {
      await db.query("UPDATE notes SET deleted_at = $1 WHERE id = $2", [
        currentDate,
        id,
      ]);
      res.send(`Deleted note with ID ${id}`);
    }
  } catch (error) {
    res.send(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
