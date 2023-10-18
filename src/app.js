import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import { v4 as uuidV4 } from "uuid";
import bcrypt from "bcrypt";
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
    console.log("entrei aqui");
    return res.status(422).send(errors);
  }

  const checkUser = await db
    .collection("registeredUsers")
    .findOne({ email: user.email });

  if (checkUser) {
    return res.status(422).send("email already being used");
  }

  const hashedPassword = bcrypt.hashSync(user.password, 10);

  try {
    await db.collection("registeredUsers").insertOne({
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
    .collection("registeredUsers")
    .findOne({ email: userLogin.email });

  if (checkUser && bcrypt.compareSync(userLogin.password, checkUser.password)) {
    const token = uuidV4();
    const session = {
      token,
      userId: checkUser._id,
    };

    await db.collection("sessions").deleteOne({ userId: checkUser._id });

    await db.collection("sessions").insertOne(session);

    return res.send(session.token);
  } else {
    res.sendStatus(422).send("User not found or incorrect password");
  }
});
