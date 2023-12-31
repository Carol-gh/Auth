const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { isValidEmail } = require ('../helpers');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const UserSchema = mongoose.Schema({
    email:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,
    },

    name: {
        type: String,
        required: true,
        trim: true,
    },

    emailVerified: {
        type: Boolean,
        default: false,
    }
})

UserSchema.statics.signup = signup;
UserSchema.statics.sendConfirmationEmail = sendConfirmationEmail;
UserSchema.statics.confirmAccount = confirmAccount;
UserSchema.statics.login = login;

mongoose.model('user', UserSchema, 'users');

function signup(userInfo){
    if (!userInfo.email || !isValidEmail(userInfo.email)) throw new Error('email is invalid');
    if (!userInfo.password) throw new Error('password is required');
    if (!userInfo.name) throw new Error('firstName is required');

    return this.findOne({email: userInfo.email})
      .then(user =>{
        if (user) throw new Error('user already exits');

        const newUser = {
            email: userInfo.email,
            password: bcrypt.hashSync(userInfo.password, 9),
            name: userInfo.name,
        };

        return this.create(newUser);
      })
      .then(userCreated => this.sendConfirmationEmail(userCreated))
      .then(user => user);
}

function sendConfirmationEmail(user){
    let transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: false,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        }
    });

    var token = jwt.sign({email: user.email}, process.env.TOKEN_SECRET);

    const urlConfirm= `${process.env.APIGATEWAY_URL}/account/confirm/${token}`;
    return transporter.sendMail({
        from: process.env.MAIL_ADMIN_ADRESS,
        to: user.email,
        subject: "Please confirm your email",
        html: `<p>Confirma tu email <a href="${urlConfirm}">Confirm</a></p>`,
    }).then(() => user);
}

function confirmAccount(token) {
    var email =null;

    try{
        const payload = jwt.verify(token, process.env.TOKEN_SECRET);
        email = payload.email;
    }catch(err){
        throw new Error('invalid token');
    }

    return this.findOne({ email })
    .then(user => {
        if (!user)throw new Error('user not found');
        if (user.emailVerified) throw new Error('user already verified');

        user.emailVerified = true;
        return user.save();
    }
    )
}

function login(email, password){
    if (!isValidEmail(email)) throw new Error('email is invalid');
    return this.findOne({ email})
    .then(user =>{
        if (!user) throw new Error('incorrect credentials');

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) throw new Error('incorrect credentials');

        const userObject = {
            _id: user._id,
            email: user.email,
            emailVerified: user.emailVerified,
            name: user.name
        };

        const access_token = jwt.sign(Object.assign({},userObject), process.env.TOKEN_SECRET, {
           expiresIn: 60 * 60 *4, 
        });
        return {
            access_token,
        }
    })
}