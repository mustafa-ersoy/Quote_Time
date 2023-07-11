const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');

function getName(name){
  var letters = [];
  for (let i = 0; i < name.length; i++) {
      const character = name[i];
      
      if (/[A-Za-z]/.test(character)) {
        letters.push(character.toLowerCase());
      }
    }
  return letters.join('');
}

const quoteSchema = new mongoose.Schema({
  _id: Number,
  name: String,
  quote: String,
  birth: String,
  death: String,
  imageName: String
});
const ratingSchema = new mongoose.Schema({
  _id : Number,
  ratingSum : Number,
  ratingCount : Number
});

const quoteModel = mongoose.model('Quote', quoteSchema);
const ratingModel = mongoose.model("Rating", ratingSchema);


mongoose.connect("mongodb://localhost:27017/quotesDB", {useNewUrlParser : true});

importData();


function importData() {
  fs.createReadStream('prev/quotes.csv')
    .pipe(csv())
    .on('data', (data) => {
      const { id, name, birth, death, quote } = data;
      var imageName = getName(name);
      const newQuote = new quoteModel({
        _id: Number(id),
        name,
        birth,
        death,
        quote,
        imageName
      });
      
      const newRating = new ratingModel({
        _id:Number(id),
        ratingSum:0,
        ratingCount:0
      });

      newQuote.save()
      newRating.save();
    })
    .on('end', () => {
      setTimeout(()=>{
        mongoose.disconnect();
        console.log('Data import completed.');
      }, 1000);
      
    });
}
