// Authentication middleware
const jwt = require('jwt');
const User = require('../models/Users');

// Protect routes - user must be logged in
const protect = async (req, res, next) =>{

    let token;
    
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){

         try{
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

                // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

                // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

        }catch(err){
            console.error(err);
            return res.status(401).json({
                message: 'Not authorized, token failed'
            });
        }
    }

    if(!token){
        return res.status(401).json({
            message: 'Not authorized, no token'
        })
    }

    //Admin only middleware
    const admin = (req, res, next) =>{
        if(req.user && req.user.role === 'admin'){
            next();
        }else{
            res.status(403).json({
                message: 'Not authorized as admin'
            })
        }
    }

    module.exports = {
        protect, admin
    };
            
      
            
        
         
            
            
       
}

// Admin only middleware
