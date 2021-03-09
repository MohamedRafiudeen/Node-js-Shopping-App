const bcrypt = require("bcryptjs");
const path = require("path");
const getDB = require("../util/database").getDB;
const Product = require("../Models/product");
const mongoDB = require("mongodb");

const mongoConnect = require("../util/database");
const User = require("../Models/User");
const mongoObjectID = mongoDB.ObjectId;

const sendGrid = require("nodemailer-sendgrid-transport");
const Transporter = require("nodemailer").createTransport(
  sendGrid({
    auth: {
      api_key:
        "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",
    },
  })
);

const crypto = require("crypto");

var fetchProdDetails;

// SHOP PAGE
// exports.shop = (req, res, next) => {
//   Product.getAll((result) => {
//     res.render("showProducts", {
//       products: result,
//       title: "Shop Page",
//       csrfToken: req.csrfToken(),
//       isLoggedIn: req.session.isLoggedIn,
//     });
//   });
// };

// shop page with pagination
exports.shop = async (req, res, next) => {
  const prodPerPage = 1;
  const page = req.query.page;
  var totalNoOfProducts;
  const db = getDB();

  //find the no. of products available in the collection
  await db
    .collection("products")
    .find()
    .count()
    .then((countValue) => {
      console.log("count", countValue);

      totalNoOfProducts = countValue;
    });

  //render the page s
  await db
    .collection("products")
    .find()
    .skip((page - 1) * prodPerPage)
    .limit(prodPerPage)
    .toArray()
    .then((products) => {
      console.log(products);
      res.render("showProducts", {
        products: products,
        title: "Shop Page",
        csrfToken: req.csrfToken(),
        isLoggedIn: req.session.isLoggedIn,
        totalNoOfProducts: totalNoOfProducts,
        hasNextPage: prodPerPage * page < totalNoOfProducts,
        hasPrevPage: parseInt(page) > 1,
        nextPage: parseInt(page) + 1,
        currentPage: page,
        prevPage: parseInt(page) - 1,
        lastPage: Math.ceil(totalNoOfProducts / prodPerPage),
      });
    });
};

//sends an add product form
exports.getAddProducts = (req, res, next) => {
  console.log("res from shopAdmin", req.body);

  res.render("productForm", {
    title: "add-products Page",
    isLoggedIn: true,
    csrfToken: req.csrfToken(),
    editing: false,
  });
};

//handles post request that adds a new product to the Product Object
exports.postAddProducts = (req, res) => {
  console.log(req.body, "req.body");

  //instantiate a new product class with the req.body data
  const newProduct = new Product(
    req.body.pName,
    req.file.path,
    req.body.pDesc,
    req.body.pPrice
  );
  console.log(req.file, "imgFile");
  console.log(newProduct, "newProduct");

  // save the new product class in the database
  newProduct.save();

  //fetch the same product from the database and render the shop page
  //('newProduct' can b directly passed too; but fetching again just to reconfirm its torage in database)
  Product.getAll((result) => {
    res.render("showProducts", {
      products: result,
      title: "Products",
      csrfToken: req.csrfToken(),
      isLoggedIn: true,
    });
  });
};

//handles get signIn requests
exports.getSignIn = (req, res) => {
  console.log("sess", req.session);
  res.render("signIn", {
    title: "Sign In..!",
    editing: false,
    isLoggedIn: false,
    err: null,
  });
};

//handles post signIn requests
exports.postSignIn = (req, res) => {
  //1   //check if the user's email exists in the database
  const db = mongoConnect.getDB();
  const user = db
    .collection("Users")
    .findOne({ email: req.body.uEmail })
    .then((exUser) => {
      //2  //if user email exists in database
      if (exUser) {
        //3  //if passwords match, save the user authentication and data in the session
        bcrypt
          .compare(req.body.uPassword, exUser.password)
          .then((doMatch) => {
            //if the passwords match
            if (doMatch) {
              req.session.user = {
                name: exUser.name,
                email: exUser.email,
                cart: exUser.cart,
              };
              req.session.isLoggedIn = true;
              req.session.save();
              res.render("homePage", {
                title: "homePage",
                isLoggedIn: true,
                csrfToken: req.csrfToken(),
              });

              //5  //send success Mail to user
              Transporter.sendMail({
                to: "sayit2rafi@gmail.com",
                from: "sayit2rafi@gmail.com",
                subject: "sendGrid successful login",
                html: `<p>Hi Rafi.. you have successfully logged in to ur DudeCart.</p>`,
              })
                .then((x) => {
                  console.log("Successfully logged in..!");
                })
                .catch((err) => {
                  console.log("sendGrid err:", err);
                });
            } else {
              req.session.isLoggedIn = false;
              res.render("signIn", {
                title: "signIn",
                isLoggedIn: req.session.isLoggedIn,
                err: "Wrong Password entered",
                editing: false,
              });
            }
          })
          .catch((err) => {
            console.log(err);
            res.render("signIn", {
              title: "signIn",
              isLoggedIn: req.session.isLoggedIn,
              err: err,
            });
          });
      } else {
        //6 //if user email is not found in the database
        req.session.isLoggedIn = false;

        console.log("user not found");
        res.render("signIn", {
          title: "signIn",
          isLoggedIn: req.session.isLoggedIn,
          err: "email does not exist",
          editing: false,
        });
      }
    });
};

//handles get signUp requests
exports.getSignUp = (req, res) => {
  res.render("signUp", {
    title: "Sign Up..!",
    editing: false,
    isLoggedIn: false,
    csrfToken: req.csrfToken(),
    err: null,
  });
};

//handles post signUp requests
exports.postSignUp = (req, res) => {
  const db = mongoConnect.getDB();
  console.log("signUp initiated...");

  //look for an existing user email in the database
  return db
    .collection("Users")
    .findOne({ email: req.body.uEmail })
    .then((exUser) => {
      console.log("val", exUser);

      //if the user email does not already exist in database
      if (!exUser) {
        //if the confirm password matches
        if (req.body.uPassword === req.body.uConfirmPassword) {
          //encrypt passwords
          bcrypt.hash(req.body.uPassword, 12).then((encPassword) => {
            //create a new user class
            const newUser = new User(
              req.body.uName,
              req.body.uEmail,
              encPassword
            );

            //save the new user data in the database
            newUser
              .save()
              //empty the password(for privacy) and save the data in the session
              .then((value) => {
                newUser.uPassword = "";
                req.session.user = {
                  email: req.body.uEmail,
                  cart: [],
                  orders: [],
                };
                req.session.isLoggedIn = true;
                req.session.save();

                res.render("homePage", { title: "HomePage", isLoggedIn: true });
                console.log("User signed up successsfully..!");
              })
              //send success Mail to user
              .then((value) => {
                Transporter.sendMail({
                  to: "sayit2rafi@gmail.com",
                  from: "sayit2rafi@gmail.com",
                  subject: "sendGrid successful login",
                  html: `<p>Hi.. you have successfully signed in to DudeCart.</p>`,
                })
                  .then((x) => {
                    console.log("Successfully logged in..!");
                  })
                  .catch((err) => {
                    console.log("sendGrid err:", err);
                  });
              })
              .catch((err) => {
                res.render("signUp", {
                  title: "signUp",
                  editing: false,
                  isLoggedIn: req.session.isLoggedIn,
                  err: err,
                });
              });
          });
        } else {
          throw "passwords dont match";
        }
      } else {
        res.render("signUp", {
          title: "signUp",
          editing: false,
          isLoggedIn: req.session.isLoggedIn,
          err: "User already exists. Please try a new email",
        });
      }
    })
    .catch((err) => {
      res.render("signUp", {
        title: "signUp",
        editing: false,
        isLoggedIn: req.session.isLoggedIn,
        err: err,
      });
    });
};

//handles user logout
exports.logout = (req, res) => {
  //finish user session
  req.session.isLoggedIn = false;
  req.session.destroy(() => {
    console.log("logout", req.session);
    res.render("homePage", { title: "HomePage", isLoggedIn: false });
  });
};

//get reser passwrod
exports.getResetPassword = (req, res) => {
  res.render("resetPassword", {
    title: "Reset Password",
    msg: null,
    err: null,
  });
};

//post reset password
exports.postResetPassword = (req, res) => {
  const db = mongoConnect.getDB();
  const exUser = db
    .collection("Users")
    .findOne({ email: req.body.uEmail })
    .then((user) => {
      if (user) {
        //generate crypto token
        crypto.randomBytes(32, (err, buffer) => {
          if (err) {
            console.log("crypto err:", err);
          } else {
            var token = buffer.toString("hex");

            const userID = user._id;
            console.log("id", userID);

            console.log("user", user);
            const updUser = new User(
              user.name,
              user.email,
              user.password,
              user._id,
              (user.resetPassToken = token),
              (user.resetPassTokenExp = Date.now() + 360000)
            );

            console.log("updUser", updUser);
            updUser
              .save(userID)
              .then(() => {
                //send the verification mail
                //send success Mail to user
                Transporter.sendMail({
                  to: "sayit2rafi@gmail.com",
                  from: "sayit2rafi@gmail.com",
                  subject: "sendGrid successful login",
                  html: `<p>Hi Rafi.. you have requested for a password reset in to ur DudeCart.</p>
                    <p>To verify your identity and proceed, click on this link: https://localhost:2000/resetPasswordVerify/${token}.</p>`,
                }).catch((err) => {
                  res.render("resetPassword", {
                    title: "Reset Password",
                    msg: null,
                    err: err,
                  });
                  console.log("sendGrid err:", err);
                });

                res.render("resetPassword", {
                  title: "Reset Password",
                  msg: `a link has been sent to ${req.body.uEmail}./br/ Kindly verify your identity in th email to proceed.`,
                  err: null,
                });
                console.log("email sent..!");
              })
              .catch((err) => {
                console.log("user save error", err);
              });
          }
        });
      }
      //if user doesnt exist under the email provided
      else {
        console.log("user not found under this email ID");
        res.render("resetPassword", {
          title: "Forgot Pasword",
          msg: null,
          err: "user not found under this email ID",
        });
      }
    })

    .catch((err) => {
      console.log("error fetching user", err);
      res.render("resetPassword", {
        title: "Forgot Pasword",
        msg: null,
        err: "error fetching user",
      });
    });
};

// get verify reset password
exports.getVerifyResetPassword = (req, res) => {
  const db = getDB.getDB();
  //see if a user in the database has the token
  const User = db
    .collection("Users")
    .findOne({ resetPassToken: req.params.token })
    .then((exUser) => {
      if (exUser) {
        const token = req.params.token;
        console.log("exUser", exUser, token);
        res.render("verifyResetPassword", {
          title: "Reset Password",
          token: token,
          msg: null,
          err: null,
        });
      } else {
        console.log("user with th etoken not found.");
      }
    })
    .catch((err) => {
      console.log("tokenFindErr:", err);
    });
};

//post verify password reset
exports.postVerifyResetPassword = (req, res) => {
  //look for the token match in db and req.query
  const db = mongoConnect.getDB();
  const user = db
    .collection("Users")
    .findOne({
      resetPassToken: req.params.token,
    })
    .then((user) => {
      if (user) {
        //if passwords match
        if (req.body.uPassword === req.body.uConfirmPassword) {
          (user.password = req.body.password),
            (user.resetPassToken = ""),
            (user.resetPassTokenExp = ""),
            new User.save(user._id)

              //send comnfirmation mail
              .then((val) => {
                Transporter.sendMail({
                  to: "sayit2rafi@gmail.com",
                  from: "sayit2rafi@gmail.com",
                  subject: "sendGrid successful login",
                  html: `<p>Hi Rafi.. you have successfully changed ur password of ur DudeCart account.</p>
                  <p>not u? report suspicous activity or block account temporarily</p>`,
                })
                  .then((x) => {
                    res.render("verifyResetPassword", {
                      title: "Reset password",
                      msg:
                        "password reset successful..! login with the new password to continue.",
                      err: null,
                    });
                    console.log("Successfully logged in..!");
                  })
                  .catch((err) => {
                    console.log("sendGrid err:", err);
                  });
              });

          //if passwords donot match
        } else {
          res.render("verifyResetPassword", {
            title: "Reset password",
            msg: null,
            err: "passwords donot match",
          });
          console.log("passwords have to match");
        }
      }

      //if user dowsnt exist with the token
      else {
        res.render("verifyResetPassword", {
          title: "Reset password",
          msg: null,
          err:
            "user doesnt exist with the given credentials or reset request timed up",
        });
      }
    })
    //if something goes wrong with fetching user
    .catch((err) => {
      res.render("verifyResetPassword", {
        title: "Reset password",
        msg: null,
        err: null,
      });
    });
};

//add to cart
exports.postAddToCart = (req, res) => {
  const db = mongoConnect.getDB();

  if (req.session.isLoggedIn) {
    const fUser = db
      .collection("Users")
      .findOne({
        email: req.session.user.email,
      })
      .then((user) => {
        if (!user) {
          console.log("user not found under this email id.");
        }
        console.log(user);

        user.cart.push(new mongoObjectID(req.params.productId));
        console.log(user, req.params.productId);
        db.collection("Users")
          .updateOne({ _id: new mongoObjectID(user._id) }, { $set: user })
          .then((value) => {
            console.log("user cart successfully updated");
          })
          .catch((err) => {
            console.log(err);
          });
      })

      .catch((err) => {
        console.log(err);
      });
  } else {
    console.log("log in to continue to cart");
  }
};

exports.clearCart = (req, res) => {
  const db = mongoConnect.getDB();

  const user = req.session.user;
  user.cart = [];
  const exUser = db
    .collection("Users")
    .findOne({ email: user.email })
    .then((u) => {
      return db
        .collection("Users")
        .updateOne({ _id: new mongoObjectID(u._id) }, { $set: user })
        .then((value) => {
          console.log("cart successfully cleared..!");
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

//display user's cart page
exports.displayCart = (req, res) => {
  // get the user id from the session
  const userID = req.session.user._id;

  const db = mongoConnect.getDB();
  const user = db
    .collection("Users")
    .findOne({ email: req.session.user.email })
    .then((exUser) => {
      if (exUser) {
        console.log("user cart", exUser.cart);

        const prods = db
          .collection("products")
          .find({
            _id: { $in: exUser.cart },
          })
          .toArray()
          .then((value) => {
            console.log("prods", value);
            res.render("cart", {
                  title: req.session.user.name + `'s` + ' '+ "cart",
                  products: value,
                });
          });
      } else {
        console.log("user not found");
      }
    })
    .catch((err) => {
      console.log(err);
    });

  // .then((exUser) => {

  //   console.log('exUser', exUser)

  //   display cart page
  //   res.render("cart", {
  //     title: req.session.user.name + `'s` + "cart",
  //     products: fetchProdDetails,
  //   });
  // })

  // .catch((err) => {
  //   console.log(err);
  // });

  // .then((exUser) => {
  //   var cart = [...exUser.cart];
  //   console.log("user cart", cart);

  //   fetch each cart product's details from the database
  //   fetchProdDetails = cart.map((prod) => {
  //     db
  //       .collection("products")
  //       .findOne({ _id: mongoDB.ObjectID(prod.productId) })
  //       .then((exProd) => {
  //         console.log("exProd", exProd);

  //             return {
  //               pName: exProd.pName,
  //               imgSrc: exProd.pImg,
  //               pPrice: exProd.pPrice,
  //             };

  //           })
  //           console.log("fetchProdCart", fetchProdDetails);
  //       .then((value) => {
  //         cart.forEach((cp) => {
  //           if (exProd._id == cp.productId) {
  //             const qty = cp.qty;

  //             return {
  //               pName: exProd.pName,
  //               qty: qty,
  //               imgSrc: exProd.pImg,
  //               pPrice: exProd.pPrice,
  //             };
  //           }
  //         });
  //       })
  //   });
  //   console.log("fetchProdCart", fetchProdDetails);
  // })
};
