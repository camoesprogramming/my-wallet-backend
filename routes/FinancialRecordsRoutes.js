import {
  financialRecords,
  financialRecordsId,
  delFinancialRecordsId,
} from "../controllers/FinancialRecords.js";
import { Router } from "express";

const FinancialRecordsRouter = Router();

FinancialRecordsRouter.get("/financial-records", financialRecords);
FinancialRecordsRouter.put("/financial-records/:id", financialRecordsId);
FinancialRecordsRouter.delete("/financial-records/:id", delFinancialRecordsId);

export default FinancialRecordsRouter;
