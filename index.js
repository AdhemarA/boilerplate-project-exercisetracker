require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const mongoDbURI = 'mongodb+srv://aahborgesnogueira:dBJZnb3UNbMqcMho@cluster0.6qowl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoDbURI);
mongoose.connection.on('connected', () => console.log('connected'));

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

let exercSesSchema = new mongoose.Schema({
  description: { type: String, required:true},
  duration:{ type: Number,required:true },
  date: String 
});

let usSchema = new mongoose.Schema({
  username: {type: String, required:true },
  log: [exercSesSchema]
});

let Sess = mongoose.model( "Session", exercSesSchema);
let User = mongoose.model( "User", usSchema);

// app.post( "/api/exercise/new-user", bodyParser.urlencoded({extended:false}), (req, res) =>{
 app.post( "/api/users", bodyParser.urlencoded({extended:false}), (req, res) =>{ 
  let newUser = new User({username: req.body.username});
  newUser.save(( error, savUser ) => {
    if(!error){
      let respObj = {};
      respObj["username"]=savUser.username;
      respObj["_id"]=savUser.id;
      res.json( respObj );
    };
  });
});

app.get( "/api/users", (req, res) => {
  User.find({}, (error, usersArr) =>{
    if(!error){
      res.json( usersArr);
    };
  });
});

app.post( "/api/users/:_id/exercises", bodyParser.urlencoded({extended:false}), (req, res) => {
  let newSess = new sessionStorage({
    description: req.body.description,
    duration: parseInt( req.body.druration),
    date: req.body.date
  });
  if(newSess.date ===""){
    newSess.date = new Date().toISOString().substring(0, 10);
  };
  User.findByIdAndUpdate(req.body.userId,
    {$push: {log: newSess}},
    {new:true},
    (error,updUser) => {
      if(!error){
      let respObj = {};
      respObj["_id"]=updUser.id;;
      respObj["username"]=updUser.username;
      respObj["date"]=new Date(newSess.date).toDateString();
      respObj["description"]=newSess.description;
      respObj["duration"]=newSess.duration;
      res.json( respObj );
    };
  }); 
});

app.get( "/api/users/:_id/logs?", (req, res) => {
  User.findById(req.query.userId, (error, result) =>{
    if(!error){
      let respObj = result;
      if(req.query.limit){
        respObj.log = respObj.log.slice(0, req.query.limit);
      };
      if( req.query.from || req.query.to){
        let frDate = new Date(0);
        let toDate = new Date();

        if(req.query.from){
          frDate = new Date(req.query.from);
        };
        if(req.query.to){
          frDate = new Date(req.query.to);
        };
        frDate = frDate.getTime();
        toDate = toDate.getTime();
        respObj.log = respObj.log.filter((session) =>{
          let sessDate = new Date( session.date).getTime();
          return sessDate >= frDate && sessDate <= toDate;
        });
      };
      respObj["cont"] = result.log.length;
      respObj.json( respObj);
    };
  });
});