const mongoose = require('mongoose')

const User = new mongoose.Schema({
    name : {
        type : String,
        required  : true
    },
    email : {
        type : String,
        required: true,
        unique : true
    },
    password : {
        type : String,
        required : true
    }
},{collection:'data'})

const model = mongoose.model('Userdta', User)

module.exports = model