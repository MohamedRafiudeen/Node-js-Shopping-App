//can only be used by a logged in user
const auth = (req,res,next) => {
    if(!req.session.isLoggedIn){

        console.log('User has to be logged in for this action');
        res.render('homePage',{title: 'Homepage', isLoggedIn: false});

    }else{
        next();
    }
}

//can only be used by a logged out user
const noAuth = (req,res,next) => {
    if(req.session.isLoggedIn){
        res.render('homePage',{title: 'Homepage', isLoggedIn: true});
    }else{
        next();
    }

}

//send loggedIN status
const logStatus = (req,res,next) => {
    if(req.session.isLoggedIn){
        res.render('homePage',{title: 'Homepage', isLoggedIn: true});
    }else{
        res.render('homePage',{title: 'Homepage', isLoggedIn: false});
    }
}


exports.auth = auth;
exports.noAuth = noAuth;
exports.logStatus = logStatus;