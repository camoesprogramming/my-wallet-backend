import express from "express";
import cors from "cors";
import AuthRouter from "../routes/AuthRoutes.js";
import NewInputRouter from "../routes/NewInputRoutes.js";
import FinancialRecordsRouter from "../routes/FinancialRecordsRoutes.js";
import logoutRouter from "../routes/LogOutRoute.js";


const PORT = 5888;
const server = express();
server.use(cors());
server.use(express.json());
server.use([AuthRouter, NewInputRouter, FinancialRecordsRouter, logoutRouter])

server.listen(PORT, () => console.log("estou rodando na porta", PORT));



