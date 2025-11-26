const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Candidate = require("../models/candidate");
const Election = require("../models/election");
const { jwtAuthMiddleware } = require("../jwt");


/*------------- Home Page ------------------*/
router.get("/", (req, res) => {
    res.render("home", { title: "Home" });
});


/*------------- Login Page ------------------*/
router.get("/login", (req, res) => {
    res.render("user/login", { title: "Login" });
});


/*------------- Signup Page ------------------*/
router.get("/signup", (req, res) => {
    res.render("user/signup", { title: "Signup" });
});


/*------------- User Dashboard/Profile ------------------*/
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);  /* user ko find kiya by ID */
    res.render("user/profile", { user, title: "Profile" });
});


/*------------- User Full Information ------------------*/
router.get("/userdata", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);  /* yaha pura user data fetch hoga */
    res.render("user/userdata", { user, title: "User Data" });
});


/*------------- Candidate List Page ------------------*/
router.get("/candidatelist", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);
    const role = req.user.role;          /* JWT se user ka role */
    const candidates = await Candidate.find(); /* sabhi candidates ko fetch karega */

    res.render("user/candidatelist", { 
        user,
        candidates,
        role,
        message: null,
        title: "Candidates"
    });
});


/*------------- Live Results Page ------------------*/
router.get("/results", async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ voteCount: -1 }); /* voteCount ke basis par sort */
    res.render("user/results", {
      winner: candidates[0], /* highest vote wala winner */
      candidates,
      title: "Results"
    });

  } catch (err) {
    console.log(err);
    res.send("Something went wrong");
  }
});


/*------------- Thank You Page After Voting ------------------*/
router.get("/thankyou", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);
    res.render("user/thankyou", { user, title: "Thank You" });
});


/*======================================
              ADMIN AREA
======================================*/


/*------------- Admin Dashboard ------------------*/
router.get("/admin/dashboard", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);

    if (user.role !== "admin") {          /* agar admin nahi toh access deny */
        return res.status(403).send("Access Denied");
    }

    res.render("admin/dashboard", { title: "Admin Panel", user, message: null });
});


/*------------- Add Candidate Page ------------------*/
router.get("/admin/addcandidates", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);

    if (user.role !== "admin") {
        return res.status(403).send("Access Denied");
    }

    res.render("admin/addcandidates", { title: "Add Candidate", user , message: null });
});


/*------------- Get All Users (Voters List) ------------------*/
router.get("/admin/voterlist", jwtAuthMiddleware, async (req, res) => {
    const loggedInUser = await User.findById(req.user.userId); /* req.user me sirf ID hoti hai isliye findById */

    if (!loggedInUser || loggedInUser.role !== "admin") {
        return res.status(403).send("Access Denied");
    }

    const voters = await User.find();  /* sabhi users ko fetch karega */

    res.render("admin/voterlist", {
        title: "Voters List",
        voters,
        message: "List of all users"
    });
});


/*------------- Edit Candidate Page ------------------*/
router.get("/admin/editcandidate/:id", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);

    if (user.role !== "admin") {
        return res.status(403).send("Access Denied");
    }

    const candidate = await Candidate.findById(req.params.id); /* candidate ki ID se find */
    if (!candidate) {
        return res.status(404).send("Candidate not found");
    }

    res.render("admin/editcandidate", { candidate, title: "Edit Candidate", user });
});


/*------------- Logout Route ------------------*/
router.get("/logout", (req, res) => {
    res.clearCookie("token");         /* JWT cookie clear karega */
    res.redirect("/login");
});


/*------------- Forgot Password Page ------------------*/
router.get("/forgot", (req, res) => {
    res.render("forgot", { title: "Forgot Password" });
});


/*------------- Set Election Time Page ------------------*/
router.get("/admin/setelection", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);

    if (user.role !== "admin") {
        return res.status(403).send("Access Denied");
    }

    res.render("admin/setelection", { title: "Set Election Time" });
});


/*------------- Save Election Time ------------------*/
router.post("/admin/setelection", jwtAuthMiddleware, async (req, res) => {
    const { startTime, endTime } = req.body;
    // Ensure only admin can perform this action
    const requestingUser = await User.findById(req.user.userId);
    if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(403).send('Access Denied');
    }

    console.log("Before Reset:", await User.find({}, "mobile isVoted votedfor"));

    // Remove old election timings
    await Election.deleteMany();

    // Reset vote counts and clear per-user vote entries on candidate documents
    await Candidate.updateMany({}, { $set: { voteCount: 0, votes: [] } });

    // Reset all users' voting state
    await User.updateMany({}, { $set: { isVoted: false, votedfor: null } });

    console.log("After Reset:", await User.find({}, "mobile isVoted votedfor"));


    const election = new Election({
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "ongoing"
    });
    await election.save();

    // redirect to admin dashboard to ensure fresh data is loaded via GET
    return res.redirect('/admin/dashboard');
});


/*------------- Stop Election ------------------*/
router.post("/admin/stop-election", async (req, res) => {
    await Election.updateOne({}, { status: "stopped" });
         console.log("After Reset:", await User.find({}, "mobile isVoted votedfor"));

    res.render("admin/dashboard", { 
        title: "Admin Dashboard",
        message: "Election has been stopped by admin."
    });
});


/*------------- Voting Page (Stop check included) ------------------*/
router.get("/vote", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);
    const election = await Election.findOne();

    if (election.status === "stopped") {
        return res.render("voter/vote", { 
            user,
            message: "Voting has been stopped by admin.",
            title: "Vote Now"
        });
    }

    res.render("voter/vote", { 
        user,
        message: null,
        title: "Vote Now"
    });
});



module.exports = router;
