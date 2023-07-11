const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const quoteSchema = new mongoose.Schema({
    _id : Number,
    name : String,
    quote : String,
    birth : String,
    death : String,
    imageName : String
});
const ratingSchema = new mongoose.Schema({
    _id : Number,
    ratingSum : Number,
    ratingCount : Number
});
const userSchema = new mongoose.Schema({
    username : {type:String, unique:true, required:true},
    userId : Number,
    password : {type:String, required:true},
    theme : String,
    unseen : Array,
    suggested : Number,
    registerDate : String
});

const suggestionSchema = new mongoose.Schema({
    _id : Number,
    userId : Number,
    name : String,
    quote : String
});

const feedbackSchema = new mongoose.Schema({
    _id : Number,
    userId : Number,
    text : String
});

userSchema.pre('save', async function(next){
    const user = this;
    if (!user.isModified('password')) return next();

    try{
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        user.password = hashedPassword;
        next();
    }catch(err){return next(err)}
});

userSchema.methods.validPassword = async function(password){
    try{
        return await bcrypt.compare(password, this.password);
    }catch(err){throw new Error(err)}
}

const quoteModel = mongoose.model("Quote", quoteSchema);
const ratingModel = mongoose.model("Rating", ratingSchema);
const userModel = mongoose.model("User", userSchema);
const suggestionModel = mongoose.model("Suggestion", suggestionSchema);
const feedbackModel = mongoose.model("Feedback", feedbackSchema);

module.exports = {quoteModel, ratingModel,userModel,suggestionModel,feedbackModel}