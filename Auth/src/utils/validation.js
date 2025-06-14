import Joi from 'joi';

class Validation {
    static validateSignup = (data) => {
        const schema = Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
        })
        return schema.validate(data)
    }

    static validateEmailVerification = (data) => {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            code: Joi.string().required()
        });

        return schema.validate(data);
    }
    static validateLogin = (data) => {
        const schema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required()
        });

        return schema.validate(data);
    }
}


export default Validation;