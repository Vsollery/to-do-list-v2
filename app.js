const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser : true});
const uri = process.env.MONGO_URI;
mongoose.connect(uri, {useNewUrlParser : true});


const workItems = [];

const itemSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model('Item', itemSchema);

const item1 = new Item({
  name: 'do something'
})

const item2 = new Item({
  name: 'do somethiing 2'
})

const item3 = new Item({
  name: 'do somethiing 3'
})

const defaultItems =[item1, item2, item3];

const listSchema ={
  name : String,
  items : [itemSchema]
}

const List  = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, (err, foundItems) => {

    if(foundItems.length === 0){
      Item.insertMany(defaultItems, (err) => {
        if(err){
          console.log(err);
        }else{
          console.log("successfully added");
        }
      });
      res.redirect("/");
    }else{
      //console.log('already added');
      res.render("list",{listTitle : 'Today', newListItems : foundItems});
    }
  })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === 'Today'){
    item.save();
    res.redirect('/');
  }
  else{
    List.findOne({name : listName}, (err,foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect('/'+ listName);
    })
  }
});

app.post('/delete', (req,res)=>{
 const checkedItemId = req.body.checkbox;
 const listName = req.body.listName;

 if(listName === 'Today'){
  Item.findByIdAndRemove(checkedItemId, (err) => {
    if(!err){
      console.log('deleted success');
      res.redirect('/');
    }
   })
 }else{
  List.findOneAndUpdate({name : listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
    if(!err){
      res.redirect('/' + listName);
    }
  })
 }
})

app.get('/:customListName', (req,res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name : customListName}, (err, foundList) => {
    if(!err){
      if(!foundList){
        const list = new List({
        name : customListName,
        items : defaultItems
        })

        list.save();
        res.redirect('/' + customListName);
      }else{
        res.render("list", {
          listTitle : foundList.name, 
          newListItems : foundList.items
        });
      }
    }
  })
})

app.get("/about", function(req, res){
  res.render("about");
});

const port = 5000;

app.listen(port, function() {
  console.log("Server started on port 5000");
});
