import { logout } from "../controllers/Logout.js";
import { Router } from "express";

const LogoutRouter = Router();

LogoutRouter.delete("/logout", logout);

export default LogoutRouter