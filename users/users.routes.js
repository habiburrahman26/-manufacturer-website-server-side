import express from "express";
import { getAllUser, createUser } from "./users.controller";

const router = express.Router();

router.route("/").get(getAllUser).post(createUser);

module.exports = router;
