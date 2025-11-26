const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
    },
    mobile: {
      type: String,
      required: true,
      unique: true, // Ensures no two users have the same mobile number
      match: [/^\d{10}$/, "Please fill a valid 10 digit mobile number"],
    },
    address: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },

    aadharCard: {
      type: String,
      required: true,
      unique: true, // Ensures no two users have the same Aadhar Card number
      match: [/^\d{12}$/, "Please fill a valid 12 digit Aadhar Card number"],
    },
    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters long"],
    },

    resetOtp: {
      type: String,
    }, // NEW
    otpExpire: {
         type: Date
         }, // NEW

    role: {
      type: String,
      enum: ["voter", "admin"], //enum-> restricts the value to be one of the specified options
      default: "voter", // Default role is 'voter'
    },

    isVoted: {
      //ye field ye track karega ki user ne vote kiya hai ya nahi
      type: Boolean,
      default: false, // By default, a user has not voted
    },
    votedfor: {
        type: String,  // or ObjectId if referencing candidate
        default: null
    }
  },
  { timestamps: true }
); // Automatically adds createdAt and updatedAt fields)

/*--------Salt & Hash Password Before Saving--------*/
userSchema.pre("save", async function (next) {
  const user = this;

  // Only hash the password if it has been modified (or is new)
  if (!user.isModified("password")) return next();
  {
    try {
      //hash password generation
      const salt = await bcrypt.genSalt(10);

      // hash password
      const hashedPassword = await bcrypt.hash(user.password, salt);
      user.password = hashedPassword; // replace plain text password with hashed password
      next();
    } catch (err) {
      return next(err);
    }
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (err) {
    throw err;
  }
};

const User = mongoose.model("User", userSchema);
module.exports = User;
