// User database model

const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'Plese add a name'],
        trim: true,
        maxlength: [50, 'Name cannot be ']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        match:  [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // Don't return password in queries
    },
     role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true // Adds createdAt and updatedAt
});



/*Encrypt password before saving(using pre-save middleware). 
this is a mongoose middleware. userSchema.pre('save', …)
→ Runs before the .save() method executes. */

userSchema.pre('save', async function (next) {

    // if (!this.isModified('password'))
    // → Checks if the password field was changed.
    // If not changed (e.g., updating name only), it skips re-hashing.
    if(!this.isModified('password')){
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);    // Replaces the plain text password with the hashed one before saving.
})


//Checks if password matches. (password comparision methode)
// Purpose → Compare a plain text password with the hashed one stored in the database.
// bcrypt.compare() → Automatically hashes the input and compares it with the stored hash.
userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
}


module.exports = mongoose.model('User', userSchema);