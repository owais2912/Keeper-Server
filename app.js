const express = require("express");
const env = require("dotenv");
const cors = require("cors");
const notesRouter = require("./routes/notesRouter");

const app = express();
app.use(cors());
env.config();
const PORT = process.env.PORT;

app.use(express.json());

app.use("/api", notesRouter);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
