const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const router = require("index.routes");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

const uri = `mongodb://0.0.0.0:27017/store`;
mongoose
  .connect(uri)
  .then(() => {
    console.log("DB connect successfully");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/", router);

app.get("/", (_, res) => {
  res.send("server running");
});

app.listen(port, () => {
  console.log("Server is Running", port);
});
