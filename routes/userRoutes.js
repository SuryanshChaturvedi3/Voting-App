const express = require("express");
const router = express.Router();
const User = require("../models/user");
const sendOTP = require("../utils/sendotp");
const { generateToken, jwtAuthMiddleware } = require("../jwt");
const electionSchema = require("../models/election");


/*---------- User Signup Route (yaha user register hota hai) ----------*/
router.post("/signup", async (req, res) => {
  try {
    const data = req.body; /* ye req.body me user ka data milega */

    /*---------- Check if user wants to be admin ----------*/
    if (data.role === "admin") {
      /*---------- Check if already one admin exists ----------*/
      const adminExists = await User.findOne({ role: "admin" });

      if (adminExists) {
        return res.status(400).json({
          message: "Only one admin is allowed. Admin already exists.",
        });
      }
    }

    /*---------- Create new user ----------*/
    const newUser = new User(data);
    const response = await newUser.save(); /* ye user ko DB me save karega */

    console.log("data saved successfully");

    const payload = {
      message: "User registered successfully",
      userId: response._id,
    };

    const token = generateToken(payload);
    res.cookie("token", token, { httpOnly: true });

    res.redirect("/login");
  } catch (err) {
    console.log("Error during user signup:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


/*---------- Login Route (user ya admin login karega) ----------*/
router.post("/login", async (req, res) => {
  try {
    const { aadharCard, password } = req.body;

    const user = await User.findOne({ aadharCard });

    /*---------- Invalid login credentials ----------*/
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid Aadhar or password" });
    }

    /*---------- Create JWT payload ----------*/
    const payload = {
      userId: user._id,
      role: user.role,
    };

    const token = generateToken(payload);
    res.cookie("token", token, { httpOnly: true });

    /*---------- Redirect based on role ----------*/
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


/*---------- Access User Profile (protected route) ----------*/
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; /* middleware se userId mila */
    const user = await User.findById(userId); /* user data fetch */

    res.status(200).json({ profile: user });
  } catch (err) {
    console.log("Error fetching user profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


/*---------- Password Update Route ----------*/
router.put("/profile/password", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; /* ye user ka ID hai */
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    /*---------- Check if current password is correct ----------*/
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    /*---------- Update new password ----------*/
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.log("Error updating password:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


/*---------- Forgot Password (Send OTP) ----------*/
router.post("/forgot", async (req, res) => {
  try {
    const { aadharCard } = req.body;
    const user = await User.findOne({ aadharCard });

    if (!user) return res.send("Aadhar number not found");

    /*---------- Generate OTP ----------*/
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetOtp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000; /* OTP 5 minutes me expire hoga */
    await user.save();

    await sendOTP(user.mobile, otp);

    console.log("OTP sending to:", user.mobile, "OTP:", otp);

    res.render("enterotp", { userId: user._id, title: "Verify OTP" });
  } catch (err) {
    console.log("Error in forgot route:", err);
    res.send("Something went wrong");
  }
});


/*---------- Verify OTP Route ----------*/
router.post("/verify-otp", async (req, res) => {
  const { userId, otp } = req.body;

  const user = await User.findById(userId);

  if (!user) return res.send("User not found");
  if (user.resetOtp !== otp) return res.send("Wrong OTP");
  if (user.otpExpire < Date.now()) return res.send("OTP expired");

  res.render("resetPassword", { userId: user._id, title: "Reset Password" });
});


/*---------- Reset Password Route ----------*/
router.post("/reset-password", async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!password) {
      return res.send("Password is missing");
    }

    await User.findByIdAndUpdate(userId, {
      password: password,
      resetOtp: null,
      otpExpire: null,
    });

    console.log("password updated");

    res.send("Password updated successfully!");
  } catch (err) {
    console.log("Error in reset-password route:", err);
    res.send("Something went wrong");
  }
});


module.exports = router;
