import db from "../config/database.js";
import joi from "joi";
import dayjs from "dayjs";

export async function newInput(req, res) {
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
    value: parseFloat(registryData.value).toFixed(2),
    description: registryData.description,
    date: currentDate,
    userId: checkUser.userId,
  });

  return res.status(200).send("Entry successfully registered!");
}

function formatCurrentDate(currentDate) {
  const dateToday = dayjs(currentDate);
  return dateToday.format("DD-MM");
}
