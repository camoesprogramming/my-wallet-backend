import { newInput } from "../controllers/NewInput.js";
import { Router } from "express";

const NewInputRouter = Router();

NewInputRouter.post("/new-input", newInput);

export default NewInputRouter;
