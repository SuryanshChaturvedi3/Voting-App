const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Candidate = require("../models/candidate");
const { jwtAuthMiddleware } = require("../jwt");


/*-------------Home Page------------------*/
router.get("/", (req, res) => {
    res.render("home", { title: "Home" });
});





// LOGIN PAGE
router.get("/login", (req, res) => {
    res.render("user/login", { title: "Login" });
});

// SIGNUP PAGE
router.get("/signup", (req, res) => {
   return res.render('user/signup', { title: "Signup" });
});

// DASHBOARD User
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);
    res.render("user/profile", { user, title: "Profile" });
});

//USER INFORMATION 
router.get("/userdata", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);
    res.render("user/userdata", { user, title: "User Data" });
});

// Show Candidate List Page
router.get("/candidateList", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);
    const role = req.user.role;               // from JWT
    const candidates = await Candidate.find(); // IMPORTANT

    res.render("user/candidateList", { 
        user, 
        candidates,
        role,
        message: null,
        title: "Candidates"
    });
});

//Live Results Page
router.get("/results", jwtAuthMiddleware, async (req, res) => {
        const user = await User.findById(req.user.userId);

    const candidates = await Candidate.find().sort({ voteCount: -1 });
res.render("user/results", {
    candidates,
    user,       // <-- required
    title: "Results"
});});




// Thank You Page after voting
router.get("/thankyou", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);
res.render("user/thankyou", { user, title: "Thank You" });
});





/*---------------------------------Admin Area--------------------------------*/
// ADMIN DASHBOARD
router.get("/admin/dashboard", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);

    if (user.role !== "admin") {
        return res.status(403).send("Access Denied");
    }

    res.render("admin/dashboard", { title: "Admin Panel", user });
});

// ADD CANDIDATE PAGE
router.get("/admin/addCandidates", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);
    if (user.role !== "admin") {
    return res.status(403).send("Access Denied");
}

    res.render("admin/addCandidates", { title: "Add Candidate", user,message:null });
});


/*----get all users(voters)----*/
router.get("/admin/voterList", jwtAuthMiddleware, async (req, res) => {
    const loggedInUser = await User.findById(req.user.userId);//ye isliye use kia hai kyu k hum req.user me sirf id rakhte hai

    if (!loggedInUser || loggedInUser.role !== "admin") {
        return res.status(403).send("Access Denied");
    }

    const voters = await User.find();

    res.render("admin/voterList", {
        title: "Voters List",
        voters,
        message: "List of all users"
    });
});


//EDIT CANDIDATE PAGE
router.get("/admin/editCandidate/:id", jwtAuthMiddleware, async (req, res) => {
    console.log("data");
    const user = await User.findById(req.user.userId);
    if (user.role !== "admin") {
    return res.status(403).send("Access Denied");
}

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
        return res.status(404).send("Candidate not found");
    }
    res.render("admin/editCandidate", { candidate, title: "Edit Candidate", user});
});


/*-----------------Logout Route------------------*/
router.get("/logout", (req, res) => {
    // Clear the JWT token cookie
    res.clearCookie("token");
    res.redirect("/login");
});

/*-------------------forgot password page------------------*/
router.get("/forgot", (req, res) => {
    
    res.render("forgot", { title: "Forgot Password" });
});


module.exports = router;
