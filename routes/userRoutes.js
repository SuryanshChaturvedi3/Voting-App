const express = require("express");
const router = express.Router();
const User = require("../models/user");
const sendOTP = require("../utils/sendotp");
const { generateToken, jwtAuthMiddleware } = require("../jwt");
const electionSchema= require("../models/election");
// Post route to sign up a new const user

/*----------User signup Route----------*/
router.post("/signup", async (req, res) => {
  try {
    const data = req.body; // ye req.body me user ka data milega jo frontend se user bhjega
    // ⭐ 1) Check if user wants to be admin
    if (data.role === "admin") {
      // ⭐ 2) Check if an admin already exists
      const adminExists = await User.findOne({ role: "admin" });

      if (adminExists) {
        return res.status(400).json({
          message: "Only one admin is allowed. Admin already exists.",
        });
      }
    }

    /*----create new user----*/
    const newUser = new User(data);
    const response = await newUser.save(); // ye user ko database me save karega
    console.log("data saved successfully");

    const payload = {
      //wo actual data jo hum response me bhejenge
      message: "User registered successfully",
      userId: response._id,
    };

    console.log(JSON.stringify(payload)); // ye payload ko JSON string me convert karke console me print karega
    const token = generateToken(payload);
    res.cookie("token", token, { httpOnly: true });

    res.redirect("/login");
  } catch (err) {
    console.log("Error during user signup:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*--------Login Route--------*/

router.post("/login", async (req, res) => {
  try {
    const { aadharCard, password } = req.body;

    const user = await User.findOne({ aadharCard });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid Aadhar or password" });
    }

    // TOKEN ONLY HAS ID + ROLE
    const payload = {
      userId: user._id,
      role: user.role,
    };

    const token = generateToken(payload);
    res.cookie("token", token, { httpOnly: true });

    if (user.role === "admin") {
      return res.redirect("/admin/dashboard");
    } else {
      return res.redirect("/profile");
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/*--------------Access User Profile Route-------------------------*/
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const userData = req.user; // ye middleware se aaya hai
    const userId = userData.userId; // ye user ka ID hai
    const user = await User.findById(userId); // ye userId ke basis pe user ko database se fetch karega
    res.status(200).json({ profile: user });
  } catch (err) {
    console.log("Error fetching user profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*--------Password Update Route--------*/
router.put("/profile/password", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; // ye user ka ID hai
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId); // ye userId ke basis pe user ko database se fetch karega

    // Check if current password matches
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.log("Error updating password:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/*--------forgot password Route--------*/
// router.post("/forgot", async (req, res) => {
//   try {
//     const { aadharCard, newPassword } = req.body;
//     console.log("aadharCard:", aadharCard);
//     const user = await User.findOne({ aadharCard });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     user.password = newPassword;
//     await user.save();
//     res.redirect("/login");
//   } catch (err) {
//     console.log("Error resetting password:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

/*----------------OTP Verification Route------------------*/

// For forgot password - send OTP
router.post("/forgot", async (req, res) => {
  try {
    const { aadharCard } = req.body;
    console.log(aadharCard);
    const user = await User.findOne({ aadharCard });
    if (!user) return res.send("Aadhar number not found");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;
    await user.save();

    await sendOTP(user.mobile, otp);
       console.log("OTP sending to:", user.mobile, "OTP:", otp);

    res.render("enterotp", { userId: user._id ,title:"Verify OTP"});
  } catch (err) {
    console.log("Error in forgot route:", err);
    res.send("Something went wrong");
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { userId, otp } = req.body;
  console.log("id found");

  const user = await User.findById(userId);

  if (!user) return res.send("User not found");
  if (user.resetOtp !== otp) return res.send("Wrong OTP");
  if (user.otpExpire < Date.now()) return res.send("OTP expired");

  res.render("resetPassword", { userId: user._id, title:"Reset Password" });
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { userId, password } = req.body;

    console.log("RESET ROUTE BODY:", req.body);

    if (!password) {
      return res.send("Password is missing");
    }

    await User.findByIdAndUpdate(userId, {
      password: password,
      resetOtp: null,
      otpExpire: null,
    });
    console.log("password updated ");

    res.send("Password updated successfully!");
  } catch (err) {
    console.log("Error in reset-password route:", err);
    res.send("Something went wrong");
  }
});

module.exports = router;
