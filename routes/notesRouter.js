const express = require("express");
const Note = require("../models/Note.js");
const User = require("../models/User.js");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saltRounds = 10;
const key = "SecretKey";
//Add User
router.post("/register", async (req, res) => {
  const { fname, lname, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = await User.create({
      fname,
      lname,
      email,
      password: hashedPassword,
    });
    const userData = {
      fname: newUser.fname,
      lname: newUser.lname,
      email: newUser.email,
    };
    res.status(201).send(userData);
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send(error.message);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const userData = {
      id: user.id,
      fname: user.fname,
      lname: user.lname,
      email: user.email,
    }; // Include any user data you want to send
    jwt.sign({ userData }, key, { expiresIn: "50000s" }, (err, token) => {
      if (err) {
        return res.status(500).json({ message: "Error generating token" });
      } else {
      }
      res.json({ token: token, user: userData }); // Send token and user data to frontend
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send(error.message);
  }
});

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader != "undefined") {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    req.token = token;
    next();
  } else {
    res.send({ result: "Invalid Token" });
  }
}

router.get("/notes", verifyToken, async (req, res) => {
  try {
    jwt.verify(req.token, key, async (err, authData) => {
      if (err) {
        res.status(401).json({ message: "Invalid Token" });
      } else {
        try {
          const notes = await Note.findAll({
            where: { deleted_at: null, user_id: authData.userData.id },
            order: [["id", "DESC"]],
          });
          res.json(notes);
        } catch (error) {
          console.error("Error fetching notes:", error);
          res.status(500).send(error.message);
        }
      }
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(500).send(error.message);
  }
});

// Add New Note
router.post("/add-note", async (req, res) => {
  const { userId, title, content } = req.body;
  try {
    await Note.create({ title, content, user_id: userId });
    res.status(201).json({ message: "Successfully added" });
  } catch (error) {
    console.error("Error adding note:", error);
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
      res.json({ message: `Deleted note with ID ${id}` });
    }
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).send(error.message);
  }
});

module.exports = router;
