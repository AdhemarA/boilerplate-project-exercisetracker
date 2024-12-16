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


=====================================================

app.post("/api/users/:_id/exercises", async(req, res) =>{
  try {
    const user = await User.findById(req.body[":_id"] || req.params._id)
    if (!user) return res.json({error:"user doesn't exist"})
    const newExercise = await Exercise.create({
      username:user.username,
      description:req.body.description,
      duration: req.body.duration, 
      date: (req.body.date)? new Date(req.body.date) : new Date(),
      })

    return res.json({
      _id:user._id,
      username:user.username,
      date: newExercise.date.toDateString(),
      duration: newExercise.duration,
      description:newExercise.description,

    })
  } catch (error) {
    console.error(error)
    return res.json({error:"Operation failed"})
  }
})



===========================================================

app.get( "/api/users/:_id/logs?", async (req, res) => {
  const{ from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if( !user){
    res.send( "User not find");
    return;
  };
  let dateObj = {};  
  if( from){
    dateObj[ "$gto"] = new Date( from);
  };
  if( to){
    dateObj[ "$lto"] = new Date( to);
  };
  let filter ={ user_id : id};
  if( from || to){
    filter.date = dateObj;
  }
  const exercises = await Exerc.find(filter).limit(-limit ?? 500);
  const log = exercises.map( e=> ({
    description: e.description,
    duration: e.duration,
    date: (e.date).toDateString() 
  }))
  res.json({ 
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  })
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
