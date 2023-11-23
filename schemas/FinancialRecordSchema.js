import joi from "joi";

export const dataRegistrySchema = joi.object({
  value: joi.number().required(),
  description: joi.string().required(),
});
