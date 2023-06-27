const getModelByName = require('../db/getModelByName');

module.exports.signup = function (req, res) {
    if (!req.body.user) return res.status(200).send[{success:false, error:'user info not found'}];

    const User =getModelByName('user');
    try {
        User.signup(req.body.user)
            .then(() => {
                res.status(200).send({success:true, message: 'user created succesfully'});
            })
    } catch (err) {
        res.status(500).send({success: false, error: err.message});
    }
}

module.exports.confirmAccount = function(req, res) {
  const User = getModelByName('user');

  try {
    User.confirmAccount(req.params.token)
    .then(() => {
        res.status(200).send({success: true, message: "user confirmed successfully"});
    }).catch(err => res.status(200).send({success:false, error: err.message}))
  }catch (err) {
  res.status(500).send({success:false, error: err.message});
  }
}

module.exports.login = function(req, res){
    if (!req.body.email) return res.status(200).send({ success:false, error: 'email is not provided'});
    if (!req.body.password) return res.status(200).send({ success: false, error: 'password is not provided'});

    const User = getModelByName('user');

    try{
        User.login(req.body.email, req.body.password)
        .then(data =>{
            res.status (200).send({ sucess:true, data});
        }).catch(err => res.status(200).send({success: false, error: err.message}))
    }catch(err){
        res.status(200).send({success: false, error:err.message});
    }
}