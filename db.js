const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI

const connectToMongo = async ()=> {
    try{
        await mongoose.connect(mongoURI);
        console.log("connected to mongo succssfully");
    }catch(error){
        console.error("Failed to connect to momgodb", error.message);
    }
};


module.exports = connectToMongo;