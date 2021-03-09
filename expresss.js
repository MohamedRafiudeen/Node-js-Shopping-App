const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const path = require("path");

const shopAdminProducts = require(path.join(__dirname,"Controllers","shopAdmin"));
const adminRoutes = require(path.join(__dirname, "routers", "adminRoutes"));
const Auth = require('./Auth');

const csurf = require('csurf');

const multer = require('multer');

const mongoConnect = require("./util/database").mongoConnect;

const session = require('express-session');
const { dirname } = require("path");
const mongodbSessionStore = require('connect-mongodb-session')(session);


const store = new mongodbSessionStore({
    uri: "mongodb+srv://Rafiudeen:fareen@cluster0.ruj5p.mongodb.net/Shop",
    collection: 'sessions'
})



//set app view engine
app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname,'styles')));
app.use('/images',express.static(path.join(__dirname,'images')));


//express-session
app.use(
  session({ secret: "secret", resave: false, saveUninitialized: false, store:store })
);

//csrf protection
const csrfProtect = csurf();
app.use(csrfProtect);


//multer
const fileStorage = multer.diskStorage({
  destination: (req,file,cb) => {
    cb(null,'./images');
  },
  filename: (req,file, cb) => {
    cb(null, + new Date().getTime() + '-' + file.originalname )
  } 
});

app.use(multer({storage: fileStorage}).single('pImg'));

app.use((req,res,next) => {
  res.locals.isLoggedIn = req.session.isLogggedIn,
  res.locals.csrfToken = req.csrfToken();
  next()
})

app.use(adminRoutes);

app.get('/signIn', Auth.noAuth, shopAdminProducts.getSignIn);
app.post('/signIn', Auth.noAuth, shopAdminProducts.postSignIn);
app.get('/signUp', Auth.noAuth, shopAdminProducts.getSignUp);
app.post('/signUp', Auth.noAuth, shopAdminProducts.postSignUp);
app.post('/logout', Auth.auth, shopAdminProducts.logout);
app.get('/shop', shopAdminProducts.shop);
app.get('/shop/addToCart/:productId', shopAdminProducts.postAddToCart);
app.get('/cart', shopAdminProducts.displayCart);
app.get('/clearCart', shopAdminProducts.clearCart);

app.get('/resetPassword', shopAdminProducts.getResetPassword);
app.post('/resetPassword', shopAdminProducts.postResetPassword);

app.get('/resetPasswordVerify/:token', shopAdminProducts.getVerifyResetPassword);
app.post('/resetPasswordVerify', shopAdminProducts.postVerifyResetPassword);

app.get("/",Auth.logStatus);


// app.get('/cart', shopAdminProducts.fetchUserCart);
// app.get('/orders', shopAdminProducts.fetchUserOrders);


//mongoCOnnect
mongoConnect(() => {
  app.listen(2000);
});
