const path = require("path");
const mongoDb = require('mongodb');

const mongoDbObjectId = mongoDb.ObjectId;

const p = path.join(__dirname, "dataStore.json");

const getDB = require("../util/database").getDB;



//store data in mongodb
module.exports = class Product {
  constructor(pName,pImg, pDesc, pPrice, userId) {
    this.pName = pName;
    this.pImg = pImg
    this.pDesc = pDesc;
    this.pPrice = pPrice;
    this.userId = userId
  }



//add product to mongoDB
  save(productId) {
    console.log("save started");

    const db = getDB();

    //if the product exists, update product.catch((err) => {})
    if(productId){

      db.collection('products').updateOne(new mongoDbObjectId(productId), {$set : this});

    }else{

    //if the product doesnt already exist, a new product will be added.
    db.collection('products').insertOne(this)
    .then((value) => {
        console.log('save result', value);
    })
    .catch((err) => {
        console.log('save err', err)
    });
    }

  }


//Fetch mongoDB products
  static getAll(cb){
      const db = getDB();

      db.collection('products').find().toArray()
      .then((result) => {
          cb(result);
          console.log('fetch products result', result);
          return result;

      })
      .catch((err) => {
          console.log('fetch products err', err)
      })
  }

};





//store data using fs

// module.exports = class Product{
//     constructor(pName, pDesc, pPrice){
//         this.pName = pName;
//         this.pDesc = pDesc;
//         this.pPrice = pPrice;
//     }

//     save(){

//         let products = [];

//         fs.readFile(p,(err,fileContent) => {
//             let fileData = JSON.parse(fileContent);

//             console.log("fileContent", fileData)
//             products = [...fileData];

//             products.push(this);

//             fs.writeFile(p,JSON.stringify(products), (err) => {
//                 console.log(err)
//             });
//         })
//     }

//     getAll(cb){
//         let file = '';
//         fs.readFile(p, (err, fileContent) => {
//         cb(JSON.parse(fileContent))
//         });

//     }

//     deleteProduct(productID){

//         fs.readFile(p,(err,fileContent) => {

//             const file = JSON.parse(fileContent);

//             const newFile = file.filter(ele => {
//                 ele.ID != productID;
//             });

//             fs.writeFile(p,JSON.stringify(newFile), (err) => {
//                 console.log(err)
//             });

//         })
//     }

// }
