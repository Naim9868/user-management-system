
const mongoose = require('mongoose');

const connectDB = async ()=>{
    try{
        const DB_connection = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB is connected: ${DB_connection.connection.host}`);
    }catch(err){
        console.error(`Database connection error: `,err);
        process.exit(1);
    }
}

module.exports = connectDB;

