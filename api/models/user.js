'use-strict';

const mongoose = require('mongoose'),
      Schema = mongoose.Schema
      bcrypt = require('bcrypt');

const userSchema = new Schema({
   username: {type: String, unique: true, require: true},
   password: {type: String, require: true},
});

userSchema.pre('save', function(next){
   let user = this;
   if(this.isModified('password') || this.isNew){
      bcrypt.genSalt(10, function(err, salt){
         if (err) return next(err);
         bcrypt.hash(user.password, salt, function(err, hash){
            if (err) return next(err);
            user.password = hash;
            next();
         })
      })
   } else {
      return next();
   }
});

// userSchema.methods.comparePassword = function(pwd, cb){
//    bcrypt.compare(pwd, this.password, function(err, isMatch){
//       if (err) return cb(err);
//       cb(null, isMatch);
//    })
// };
userSchema.methods.comparePassword = function(pwd){
   bcrypt.compare(pwd, this.password, function(err, isMatch){
      if (err) return false;
      return true;
   })
};

module.exports = mongoose.model('User', userSchema);
