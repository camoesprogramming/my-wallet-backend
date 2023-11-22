import bcrypt from "bcrypt";
import { v4 as uuidV4 } from "uuid";
import db from "../config/database.js";
import joi from "joi";

export async function signUp(req, res) {
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
    return res.status(409).send("email already being used");
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
}

export async function signIn(req, res) {
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
    return res.status(422).send(errors);
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

    const userData = { token: session.token, name: session.name };

    return res.send(userData);
  } else {
    res.status(422).send("User not found or incorrect password");
  }
}
