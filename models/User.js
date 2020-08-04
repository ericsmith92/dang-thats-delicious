const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid Email Address'],
        required: 'Please supply an email address'
    },
    name:{
        type: String,
        required: 'Please supply a name',
        trim: true
    }
});

//make a virtual field, this is for something that can just be generated and thus, does not need to be stored
//for example, if we are storing weight in lbs, we don't need to also store in KG, we can calculate that

userSchema.virtual('gravatar').get(function(){
    //we used a proper function to access keyword this
    //this refers to User, so we get the email off that
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email'} );
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);

