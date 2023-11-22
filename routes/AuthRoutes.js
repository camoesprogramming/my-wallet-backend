import { SignIn, SignUp } from "../controller/Auth.js";
import { Router } from "express";

const AuthRouter = Router();

// Rotas de autenticação
AuthRouter.post("/sign-in", SignIn);
AuthRouter.post("/sign-up", SignUp);

export default AuthRouter