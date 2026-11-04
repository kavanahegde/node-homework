const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().trim().min(3).max(30).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).required().invalid(
    'password',
    '12345678',
    'password123'
  ),
});

module.exports = { userSchema };
