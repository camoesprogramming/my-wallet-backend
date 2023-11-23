import joi from "joi";

export const userLoginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
  });

  export const userSchema = joi.object({
    name: joi.string().min(3).max(40).required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
    repeatPassword: joi.string().valid(joi.ref("password")).required(),
  });