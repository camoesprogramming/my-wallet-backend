import db from "../config/database.js";

export async function logout(req, res) {
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
}
