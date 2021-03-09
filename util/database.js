//connecting app to mongoDb
const mongodb = require("mongodb");
const mongoCLient = mongodb.MongoClient;
let _db;


//connects the app to the databse; and returns a cursor
const mongoConnect = (cb) => { 
  mongoCLient
    .connect(
      "mongodb+srv://****:***********@cluster.*****.mongodb.net/Shop?retryWrites=true&w=majority",{ useUnifiedTopology: true }
    )

    .then((client) => {
      console.log('mongodb connected..!');
      _db = client.db();
      cb()
    })
    .catch((err) => {
      console.log("mongoErr", err);
    });
};



//returns the db() object from the Client object
const getDB = () => {
     if(_db){
        return _db;
    } else{
        console.log('db not found:)')
    }
}

exports.mongoConnect = mongoConnect;
exports.getDB = getDB;
