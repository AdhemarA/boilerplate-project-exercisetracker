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

function logexe(req, res, next){
  console.log(req.method, req.path, req.params, req.query, req.body);
  next();
}
app.use(logexe);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let exercSesSchema = new mongoose.Schema({
  username: {type: String, required:true},
  description: { type: String, required:true},
  duration:{ type: Number,required:true },
  date: { type: String,required:false },
  userId: {type: String, required:true}
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

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id; 
  
  let { description, duration, date } = req.body; 

  if (!date) {
      date = (new Date(Date.now())).toDateString();
  } else {
      const parts = date.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const utcDate = new Date(Date.UTC(year, month, day));
      date =  new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000).toDateString();
  };

  let theUser = await User.findById(userId); 
 
  const newExerc = new Exerc({
    username: theUser.username, 
    description, 
    duration: Number(duration),
    date,
    userId: userId, 
  });

  await newExerc.save();

  res.json({
    _id: theUser._id,
    username: theUser.username,
    description: newExerc.description,
    duration: newExerc.duration,
    date: newExerc.date.toDateString(),
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
