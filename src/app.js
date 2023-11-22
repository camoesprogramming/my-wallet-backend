import express from "express";
import cors from "cors";
import { ObjectId } from "mongodb";
import joi from "joi";
import { v4 as uuidV4 } from "uuid";
import bcrypt from "bcrypt";
import dayjs from "dayjs";
import db from "../config/database.js";
import AuthRouter from "../routes/AuthRoutes.js";
import NewInputRouter from "../routes/NewInputRoutes.js";
import FinancialRecordsRouter from "../routes/FinancialRecords.js";


const PORT = 5888;
const server = express();
server.use(cors());
server.use(express.json());
server.use([AuthRouter, NewInputRouter, FinancialRecordsRouter])

server.listen(PORT, () => console.log("estou rodando na porta", PORT));


server.delete("/logout", async (req, res) => {
  const { authorization } = req.headers;

  const token = authorization?.replace("Bearer ", "");
  if (!token) return res.status(400).send("Please, make login!");

  try {
    db.collection("sessions").deleteOne({ token });
    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.status(500).send(error);
  }
});

