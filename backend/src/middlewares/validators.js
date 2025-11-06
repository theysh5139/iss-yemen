import Joi from 'joi';

export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Validation failed', details: error.details.map(d => d.message) });
    }
    req.body = value;
    next();
  };
}

export const signupSchema = Joi.object({
  name: Joi.string().min(2).max(80).optional().allow(''),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/)
    .message('Password must include upper, lower, and a digit')
    .required(),
  confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({ 'any.only': 'Passwords must match' })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required()
});

export const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required()
});

export const passwordResetSchema = Joi.object({
  token: Joi.string().required(),
  email: Joi.string().email().required(),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/)
    .message('Password must include upper, lower, and a digit')
    .required(),
  confirmPassword: Joi.any().valid(Joi.ref('newPassword')).required().messages({ 'any.only': 'Passwords must match' })
});

export const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required()
});


