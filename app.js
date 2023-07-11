const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const {quoteModel, ratingModel, userModel,suggestionModel,feedbackModel} = require('./schemas');

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

app = express();
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static("public"));
app.set("view engine", 'ejs');

app.use(session({
    secret : 'mysecret',
    resave : false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/quotesDB", {useNewUrlParser : true});

passport.use(new LocalStrategy({usernameField : 'username', passwordField:'password'},
    async function(username, password, done){
        try{
            const user = await userModel.findOne({username : username});
            if (!user){
                return done(null,false,{})}
            if (!(await user.validPassword(password))){
                return done(null,false,{})}
            return done(null, user);
        }catch(err){
            return done(err)}
    }
));
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
passport.deserializeUser(async function(id, done) {
    try {
      const user = await userModel.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

let quoteIds = [];
function getNewQuotes(source){
    let flag = true;
    let newQuotes = [];
    while (newQuotes.length < 4 && flag) {
        const randomIndex = Math.floor(Math.random() * source.length);
        const randomNumber = source[randomIndex];
    
        newQuotes.push(randomNumber);
        source.splice(randomIndex, 1);

        if (source.length === 0){flag = false}
    }
    return newQuotes;
}

app.get('/', async function(req, res){
    if (req.isAuthenticated()){
        try{
            let userId = req.user.userId;
            let user = await userModel.findOne({userId:userId});
            if (user.unseen.length === 0){res.redirect('/suggest')} else{
            if (quoteIds.length === 0){
                quoteIds = getNewQuotes(user.unseen);
            }
            index = quoteIds[0];
            let data = await quoteModel.findOne({_id:index});
            let ratingInfo = await ratingModel.findOne({_id:index});
            let rating = '0.0';
            let theme = user.theme;
            if (ratingInfo.ratingCount > 0){rating = (ratingInfo.ratingSum/ratingInfo.ratingCount).toFixed(1)}
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.render('index', {name:data.name, owner:data.imageName, pagename:'/', quote:data.quote, score:rating, renderId:index, birth:data.birth, death:data.death, footercolor:theme+'-f',
        navcolor:theme+'-nav', bodycolor:theme+'-body', themecolor:theme})
        }} catch(err){console.error(err)}
    } else{res.redirect('/login')}
});

app.post('/rate', async function(req, res){
    if (req.isAuthenticated()){
    try{
        let userId = req.user.userId;
        let score = Number(req.body.rating);
        if (score > 0){
            let id = req.body.renderId;
            let ratingInfo = await ratingModel.findOne({_id:index});
        await ratingModel.updateOne({_id:id}, {$set: {ratingSum:ratingInfo.ratingSum+score, ratingCount:ratingInfo.ratingCount+1}})}
        await userModel.updateOne({userId:userId}, {$pull:{unseen : quoteIds[0]}});
        quoteIds.shift();
        res.redirect('/');
    } catch(err){console.error(err)}}
    else {res.redirect('/login')}
});

app.post('/changetheme', async function(req, res){
    if (req.isAuthenticated()){
    try{
        let userId = req.user.userId;
        let pagename = req.body.pagename;
        let user = await userModel.findOne({userId:userId});
        if (user.theme === 'white'){
            await userModel.updateOne({userId:userId}, {$set:{theme:'dark'}});
        }
        else{
            await userModel.updateOne({userId:userId}, {$set:{theme:'white'}});
        }
        res.redirect(pagename);
    } catch(err){console.error(err)}}
    else {res.redirect('/login')}
});

app.post('/login',
    passport.authenticate('local', {
        successRedirect : '/',
        failureRedirect : '/loginError',
        failureFlash : true}));

app.post('/register', async function(req, res){
    try{
        let checkUser = await userModel.findOne({username : req.body.username});
        if (checkUser){return res.render('register', {error:'This username is already taken 😔'})} else{
        let quoteCount = await quoteModel.countDocuments({});
        let userCount = await userModel.countDocuments({});
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;
        const newUser = new userModel({
            username : req.body.username,
            userId : userCount,
            password : req.body.password,
            theme : 'dark',
            suggested : 0,
            registerDate : formattedDate,
            unseen : Array.from({ length: quoteCount }, (_, index) => index)});
        await newUser.save();
        res.redirect('/login');
    }}catch(err){console.error(err)}
    });

app.post('/feedback', async function(req, res){
    if (req.isAuthenticated()){
    try{
        let userId = req.user.userId;
        let feedbackCount = await feedbackModel.countDocuments({});
        let newFeedback = feedbackModel({
            _id : feedbackCount,
            userId : userId,
            text : req.body.feedback
        });
        await feedbackModel.insertMany(newFeedback);
        res.redirect('/thanks');
    }catch(err){console.log(err)}}
    else {res.redirect('/login')}
});

app.post('/suggest', async function(req, res){
    if (req.isAuthenticated()){
        try{
            let userId = req.user.userId;
            let suggestCount = await suggestionModel.countDocuments({});
            let newSuggestion = suggestionModel({
                _id : suggestCount,
                userId : userId,
                name : req.body.name,
                quote : req.body.quote
            });
            await suggestionModel.insertMany(newSuggestion);
            await userModel.updateOne({userId : userId}, {$inc : {suggested:1}});
            res.redirect('/thanks');
        }catch(err){console.log(err)}
    }else {res.redirect('/login')}
});

app.get('/logout', function(req, res){
    req.logout(()=>{});
    res.redirect('/');
});

app.get('/suggest', async function(req, res){
    if (req.isAuthenticated()){
    try{
        let userId = req.user.userId;
        let user = await userModel.findOne({userId:userId});
        theme = user.theme;
        res.render('suggest', {pagename:'/suggest',footercolor : theme+'-f', navcolor : theme+'-nav', bodycolor : theme+'-body', themecolor : theme});
    }catch(err){console.error(err)}}
    else {res.redirect('/login')}
});

app.get('/account', async function(req, res){
    if (req.isAuthenticated()){
        try{
            let userId = req.user.userId;
            let user = await userModel.findOne({userId:userId});
            let quoteCount = await quoteModel.countDocuments({});
            let theme = user.theme;
            res.render('account', {pagename:'/account', seen:quoteCount-user.unseen.length, username:user.username, date:user.registerDate, 
            suggested:user.suggested, footercolor : theme+'-f', navcolor : theme+'-nav', bodycolor : theme+'-body', themecolor : theme});
        }catch(err){console.error(err)}
    }
    else {res.redirect('/login')}
});

app.get('/feedback', async function(req,res){
    if (req.isAuthenticated()){
        try{
            let userId = req.user.userId;
            let user = await userModel.findOne({userId:userId});
            theme = user.theme;
            res.render('feedback', {pagename:'/feedback',footercolor : theme+'-f', navcolor : theme+'-nav', bodycolor : theme+'-body', themecolor : theme});
        }catch(err){console.error(err)}}
    else {res.redirect('/login')}
});

app.get('/thanks', function(req, res){
    if (req.isAuthenticated()){
        res.render('thanks', {pagename:'/thanks',footercolor : theme+'-f', navcolor : theme+'-nav', bodycolor : theme+'-body', themecolor : theme});
    }else {res.redirect('/login')}
});

app.get('/register', function(req, res){
    res.render('register', {error:''});
})
app.get('/login', function(req, res){
    res.render('login', {error : ''});
});
app.get('/loginError', function(req, res){
    res.render('login', {error : 'Invalid Credentials!'});
});

app.listen(3000, function() {
    console.log("listening to port 3000");
});