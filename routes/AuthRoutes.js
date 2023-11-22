import { signIn, signUp } from "../controller/Auth.js";
import { Router } from "express";

const AuthRouter = Router();

// Rotas de autenticação
AuthRouter.post("/sign-in", signIn);
AuthRouter.post("/sign-up", signUp);

export default AuthRouter;
