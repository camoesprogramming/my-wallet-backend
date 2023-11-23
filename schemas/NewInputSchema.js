import joi from "joi";

export const registryDataSchema = joi.object({
    income: joi.boolean().required(),
    value: joi.number().required(),
    description: joi.string().max(18).required(),
  });