const mongoDB = require('mongodb');
const getDB = require('../util/database');
const mongoObjectID = mongoDB.ObjectId;



class User{
    constructor(name,email,password,_id,resetPassToken = null,resetPassTokenExp = null) {
        this.name = name,
        this.email = email,
        this.password = password,
        this._id = _id,

        this.cart = [],
        this.resetPassToken = resetPassToken,
        this.resetPassTokenExp = resetPassTokenExp
    }


//add new user to mongodb
    save(userId = null){
        const db = getDB.getDB();

        //if a userID is passed, it looks for the user in the database and
        // updates if found
        
        if(userId){   
            console.log('userID', userId)
            return db.collection('Users').updateOne({_id: new mongoObjectID(userId)}, {$set: this});
    } else{

        return db.collection('Users').insertOne(this);
    }
    }


//delete a user from database
    delete(userId){
        const db = getDB();

        return db.collection('Users').deleteOne({_id: new mongoObjectID(userId)});
    }

//get user cart
    getCart(userId){
        const db = getDB();

        return db.collection('Users').find(new mongoObjectID(userId)).cart;
    }

//add a product to Cart
    addToCart(productId,qty){
        
        const currentUser = req.sessions.user;
        const currentUserId = req.sessions.user._id;

        const db = getDB();


     //check if the product already exists in cart of 'currentUser'; and find its index position
        let prodInCart = currentUser.cart.findIndex(prod => {
            console.timeLog('pId',prod)
            return prod._id === new mongoObjectID(productId);
        }) 

        //if product is not already present, adds the productId to the cart; and sets the qty as 1
        if(!prodInCart){

            currentUser.cart.push({productId, quantity: 1});

        } else{ 
           
        //else if the product already exists, the qty provided by the user is addded with the productId
            var updatedCartProd = currentUser.cart[prodInCart].quantity = qty;

            currentUser.cart.splice(prodInCart,1,updatedCartProd);  
        }


        //replaces the whole user in the database
        db.collection('Users').updateOne(new mongoObjectID(currentUserId), {$set : currentUser})
    
        .then((value) => {

         //fetch and update the user cart in the session
           const updatedUser = this.fetchUserbyId(currentUserId);
           req.session.user.cart = updatedUser.cart;
           req.session.save();
        })
    }


//remove a product to Cart
   removeFromCart(productId){
      const db = getDB();

      const currentUser = req.sessions.user;
      const currentUserId = req.sessions.user._id;

      //removes the product from the user's cart
      const newUserCart = user.cart.filter( product => {
          product.productId != productId
      });

      //fetch the whole user data from the databse and replace its cart
      const updatedUser = this.fetchUserbyId(currentUserId);
      updatedUser.cart = newUserCart;

      //replaces the whole user in the database
      db.collection('Users').updateOne(new mongoObjectID(currentUserId), {$set : newUser})

      .then((value) => {

        //update the user cart in the session
          req.session.user.cart = updatedUser.cart;
          req.session.save();
       })
    }

//takes the id of a user and fetches it from the database
   fetchUserbyId(userId){
     return db.collection('Users').find(new mongoObjectID(currentUser));
   }


}

module.exports = User;