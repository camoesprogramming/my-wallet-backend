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


const PORT = 5888;
const server = express();
server.use(cors());
server.use(express.json());
server.use([AuthRouter, NewInputRouter])

server.listen(PORT, () => console.log("estou rodando na porta", PORT));



server.post("/new-input", async (req, res) => {
  
});

server.get("/financial-records", async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(400).send("Please, make login!");

  const checkUser = await db.collection("sessions").findOne({ token });

  if (!checkUser) return res.status(401).send("Not Authorized!");

  const data = await db
    .collection("financialRecords")
    .find({ userId: new ObjectId(checkUser.userId) })
    .toArray();

  if (data.length === 0) {
    return res.status(404).send("Non existent financial records");
  }

  const sanitizedData = data.map((d) => {
    const sanitizedD = { ...d };
    sanitizedD.id = sanitizedD._id;
    delete sanitizedD.userId;
    delete sanitizedD._id;
    return sanitizedD;
  });

  return res.status(200).send(sanitizedData);
});

server.put("/financial-records/:id", async (req, res) => {
  const { authorization } = req.headers;
  const { id } = req.params;
  const dataRegistry = req.body;

  const token = authorization?.replace("Bearer ", "");
  if (!token) return res.status(400).send("Please make login");

  const checkUser = await db.collection("sessions").findOne({ token });
  if (!checkUser) return res.status(401).send("Not Authorized!");

  try {
    const foundRegistry = await db
      .collection("financialRecords")
      .findOne({ _id: new ObjectId(id) });

    const checkUserRegistry = checkUser.userId.equals(foundRegistry.userId);
    if (!checkUserRegistry)
      return res
        .status(401)
        .send("You are not authorized to modify this registry");
  } catch (error) {
    console.error("Invalid financial record ID, ", error);
    return res.status(401).send("Invalid Financial Record ID");
  }

  const dataRegistrySchema = joi.object({
    value: joi.number().required(),
    description: joi.string().required(),
  });

  const validateDataRegistry = dataRegistrySchema.validate(dataRegistry, {
    abortEarly: false,
  });

  if (validateDataRegistry.error) {
    const errors = validateDataRegistry.error.details.map(
      (detail) => detail.message
    );
    return res.status(422).send(errors);
  }

  try {
    const result = await db.collection("financialRecords").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          value: dataRegistry.value,
          description: dataRegistry.description,
        },
      }
    );

    if (result.modifiedCount === 0)
      return res.status(404).send("Financial Record was not Updated");

    res.send("Financial record updated");
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

server.delete("/financial-records/:id", async (req, res) => {
  const { authorization } = req.headers;
  const { id } = req.params;

  const token = authorization?.replace("Bearer ", "");
  if (!token) return res.status(400).send("Please make login!");

  const checkUser = await db.collection("sessions").findOne({ token });
  if (!checkUser) return res.status(401).send("Not Authorized!");

  const foundRegistry = await db
    .collection("financialRecords")
    .findOne({ _id: new ObjectId(id) });

  if (!foundRegistry)
    return res.status(400).send("Financial Record not found!");

  const checkUserRegistry = checkUser.userId.equals(foundRegistry.userId);
  if (!checkUserRegistry)
    return res
      .status(401)
      .send("You are not authorized to delete this record!");

  try {
    await db
      .collection("financialRecords")
      .deleteOne({ _id: new ObjectId(id) });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(error);
  }
});

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

function formatCurrentDate(currentDate) {
  const dateToday = dayjs(currentDate);
  return dateToday.format("DD-MM");
}
