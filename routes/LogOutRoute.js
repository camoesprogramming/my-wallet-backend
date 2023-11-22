import { logout } from "../controller/Logout.js";
import { Router } from "express";

const LogoutRouter = Router();

LogoutRouter.delete("/logout", logout);

export default LogoutRouter