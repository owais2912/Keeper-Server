const express = require("express");
const Note = require("../models/Note.js");

const router = express.Router();

// Get List of Notes
router.get("/notes", async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: { deleted_at: null },
      order: [["id", "DESC"]],
    });
    res.send(notes);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Add New Note
router.post("/add-note", async (req, res) => {
  try {
    const { title, content } = req.body;
    await Note.create({ title, content });
    res.send("Successfully added");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Delete Note
router.post("/delete-note/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const note = await Note.findByPk(id);
    if (!note) {
      return res.status(404).send(`Note with ID ${id} not found`);
    }
    if (!note.deleted_at) {
      await note.update({ deleted_at: new Date() });
      res.send(`Deleted note with ID ${id}`);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
