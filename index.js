require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongo = require('mongodb');
const mongoose= require('mongoose');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const mongoDbURI = 'mongodb+srv://aahborgesnogueira:dBJZnb3UNbMqcMho@cluster0.6qowl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
// mongoose.connect(mongoDbURI);
// mongoose.set('useFindAndModify', false);

mongoose.connect(mongoDbURI, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS:5000 });
mongoose.connection.on('connected', () => console.log('connected'));

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:false}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let exercSesSchema = new mongoose.Schema({
  description: { type: String, required:true},
  duration:{ type: Number,required:true },
  date: { type: String,required:false },
  _id: {type: String, required:true}
});

let usSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

let Exerc = mongoose.model( "Exerc", exercSesSchema);
let User = mongoose.model( "User", usSchema);

app.post( "/api/users", bodyParser.urlencoded({extended:false}), (req, res) =>{
// app.post( "/api/users", async (req, res) =>{ 
  let newUser = new User({username: req.body.username});
  newUser.save((error, savedUser) =>{
    if(!error){
      let respObj = {};
      respObj["username"]= savedUser.username;
      respObj["_id"]= savedUser._id;
      res.json( respObj);
    }
  })
});

app.get( "/api/users", (req, res) => {
  User.find({}, (error, usersArr) =>{
    if(!error){
      res.json( usersArr);
    };
  });
});

app.post("/api/users/:_id/exercises", (req, res) =>{
  let userId = req.params._id;
  let exercDate = "";

  if( req.body.date != ''){
    exercDate = req.body.date;
  } else{
    exercDate.date = new Date().toDateString().substring(0, 10);
  };

  let exerObj = {
    description:req.body.description,
    duration: req.body.duration, 
    date: exercDate,
  };

  let newExerc = new Exerc( exerObj);

  User.findById( userId, (err, userFound) =>{
    if(err){
      console.log( err);
      return;
    }; 
    }); 

   newExerc.findById( userId, (err, exeFound) =>{
    if(err){
      console.log( err);
      return;
    }else{

    }; 


 newExerc.save();
    n
  });   
});

app.get("/api/users/:_id/logs", async(req, res)=>{
  try {
    let result = {};
    let consult = {};
    let from = null;
    let to = null;

    const userl = await User.findById(req.params._id);

    consult.username = userl.username;
    result._id = userl._id;
    result.username = userl.username;

    if (req.query.from){
      from = new Date (req.query.from + "T00:00:00.000-06:00"); 
      consult.date = {...consult.date, $gte:from};
      result.from = from.toDateString();
     };

    if (req.query.to){
      to = new Date (req.query.to + "T00:00:00.000-06:00");
      consult.date = {...consult.date, $lte:to};
      result.to = to.toDateString();
     };
    
    const log = await Exerc.find(consult).limit(parseInt(req.query.limit)).select({_id:0, username:0, __v:0});

    let resulLog = [];

    for(let entry of log){
      resulLog.push({description:entry.description, duration:entry.duration, date:entry.date.toDateString()});
    }

    result.count = log.length;
    result.log = resulLog;
    return res.json(result);

  } catch (error) {
    console.error(error);
    return res.json({error:"Operation failed"});
  };

});
const checkDate = (date) => {
  if (!date) {
      return (new Date(Date.now())).toDateString();
  } else {
      const parts = date.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);

      const utcDate = new Date(Date.UTC(year, month, day));
      return new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000).toDateString();
  }
}

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
