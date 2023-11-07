import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import { v4 as uuidV4 } from "uuid";
import bcrypt from "bcrypt";
import dayjs from "dayjs";
dotenv.config();

const PORT = 5888;
const server = express();
server.use(cors());
server.use(express.json());

server.listen(PORT, () => console.log("estou rodando na porta", PORT));

const mongoClient = new MongoClient(process.env.DATABASE_URL);

let db;

try {
  await mongoClient.connect();
} catch (error) {
  console.log(error);
}
db = mongoClient.db();

server.post("/sign-up", async (req, res) => {
  const user = req.body;

  const userSchema = joi.object({
    name: joi.string().min(3).max(40).required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
    repeatPassword: joi.string().valid(joi.ref("password")).required(),
  });

  const validation = userSchema.validate(user, { abortEarly: false });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  const checkUser = await db.collection("users").findOne({ email: user.email });

  if (checkUser) {
    return res.status(422).send("email already being used");
  }

  const hashedPassword = bcrypt.hashSync(user.password, 10);

  try {
    await db.collection("users").insertOne({
      name: user.name,
      email: user.email,
      password: hashedPassword,
    });
    return res.status(200).send("Your user has been registered!");
  } catch (error) {
    return res.status(500).send("Internal error server");
  }
});

server.post("/sign-in", async (req, res) => {
  const userLogin = req.body;

  const userLoginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
  });

  const validateLoginAtempt = userLoginSchema.validate(userLogin, {
    abortEarly: false,
  });

  if (validateLoginAtempt.error) {
    const errors = validateLoginAtempt.error.details.map(
      (detail) => detail.message
    );
    return res.sendStatus(422).send(errors);
  }

  const checkUser = await db
    .collection("users")
    .findOne({ email: userLogin.email });

  if (checkUser && bcrypt.compareSync(userLogin.password, checkUser.password)) {
    const token = uuidV4();
    const session = {
      token,
      userId: checkUser._id,
      name: checkUser.name,
    };

    await db.collection("sessions").deleteOne({ userId: checkUser._id });

    await db.collection("sessions").insertOne(session);

    const userData = {token: session.token,name: session.name}

    return res.send(userData);
  } else {
    res.status(422).send("User not found or incorrect password");
  }
});

server.post("/new-input", async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(400).send("please make login");

  const checkUser = await db.collection("sessions").findOne({ token });

  if (!checkUser) return res.status(401).send("Not Authorized");

  const registryData = req.body;
  const registryDataSchema = joi.object({
    income: joi.boolean().required(),
    value: joi.number().required(),
    description: joi.string().max(18).required(),
  });

  const validateData = registryDataSchema.validate(registryData, {
    abortEarly: false,
  });

  if (validateData.error) {
    const errors = validateData.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  const currentDate = formatCurrentDate(Date.now());

  await db.collection("financialRecords").insertOne({
    income: registryData.income,
    value: parseInt(registryData.value).toFixed(2),
    description: registryData.description,
    date: currentDate,
    userId: checkUser.userId,
  });

  return res.status(200).send("Entry successfully registered!");
});

server.get("/financial-records", async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.status(400).send("Please, make login!");

  const checkUser = await db.collection("sessions").findOne({ token });

  if (!checkUser) return res.status(401).send("Not Authorized!");

  const data = await db
    .collection("financialRecords")
    .find({ userId: checkUser.userId })
    .toArray();

  if (data.length === 0) {
    return res.status(404).send("Non existent financial records");
  }
  const sanitizedData = data.map(({ userId, ...rest }) => rest);

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
