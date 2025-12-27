require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

//Database imports...
const connectDB = require('./config/database');

//Routes imports...
const authRoutes = require('./routes/auth');
const usersRoutes =require('./routes/users');
const adminRoutes = require('./routes/admin');

//Connect to database
connectDB();

const app = express();

//Rate limiting..
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 100  //limit each IP to 100 request per windowMs
});

app.use('/api/auth', limiter);

//Middleware
app.use(cors());;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//Routes 
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);



app.get("/",(req,res)=>{
    res.json({
        message: "user-management-system",
        welcome: "Welcome to the server."
    })
});

const port = process.env.PORT;
app.listen(port, async ()=>{
    console.log(`Server is connected at http://localhost:${port}`);
    // await connectDB();

})