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
  confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({ 'any.only': 'Passwords must match' }),
  role: Joi.string().valid('member', 'admin').optional()
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

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string()
    .pattern(/^\d{6}$/)
    .message('OTP must be exactly 6 digits')
    .required()
});

export const resendOtpSchema = Joi.object({
  email: Joi.string().email().required()
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(80).optional().allow(''),
  email: Joi.string().email().optional()
});

export const createAnnouncementSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).required(),
  date: Joi.date().required(),
  location: Joi.string().min(2).max(200).optional().allow(''),
  category: Joi.string().valid('News', 'Announcement', 'Activity', 'Cultural', 'Academic', 'Social').optional(),
  isPublic: Joi.boolean().optional()
});

export const updateAnnouncementSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).optional(),
  date: Joi.date().optional(),
  location: Joi.string().min(2).max(200).optional().allow(''),
  category: Joi.string().valid('News', 'Announcement', 'Activity', 'Cultural', 'Academic', 'Social').optional(),
  isPublic: Joi.boolean().optional()
});

export const createEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).required(),
  date: Joi.date().required(),
  location: Joi.string().min(2).max(200).required(),
  category: Joi.string().valid('News', 'Announcement', 'Activity', 'Cultural', 'Academic', 'Social').required(),
  type: Joi.string().valid('event', 'announcement', 'activity').optional(),
  schedule: Joi.string().max(200).optional().allow(''),
  isRecurring: Joi.boolean().optional(),
  isPublic: Joi.boolean().optional(),
  fee: Joi.number().min(0).optional()
});

export const updateEventSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).optional(),
  date: Joi.date().optional(),
  location: Joi.string().min(2).max(200).optional().allow(''),
  category: Joi.string().valid('News', 'Announcement', 'Activity', 'Cultural', 'Academic', 'Social').optional(),
  type: Joi.string().valid('event', 'announcement', 'activity').optional(),
  schedule: Joi.string().max(200).optional().allow(''),
  isRecurring: Joi.boolean().optional(),
  isPublic: Joi.boolean().optional(),
  fee: Joi.number().min(0).optional(),
  cancelled: Joi.boolean().optional()
});


