const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Candidate = require("../models/candidate");
const Election = require("../models/election");
const { jwtAuthMiddleware } = require("../jwt");


/*-------------Home Page------------------*/
router.get("/", (req, res) => {
    res.render("home", { title: "Home" });
});





// LOGIN PAGE
router.get("/login", (req, res) => {
    res.render("user/login", { title: "Login" });
});

// signup PAGE
router.get("/signup", (req, res) => {
   return res.render('user/signup', { title: "signup" });
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
router.get("/candidatelist", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);
    const role = req.user.role;               // from JWT
    const candidates = await Candidate.find(); // IMPORTANT

    res.render("user/candidatelist", { 
        user, 
        candidates,
        role,
        message: null,
        title: "Candidates"
    });
});

//Live Results Page
// router.get("/results", jwtAuthMiddleware, async (req, res) => {
//         const user = await User.findById(req.user.userId);

//     const candidates = await Candidate.find().sort({ voteCount: -1 });
// res.render("user/results", {
//     candidates,
//     user,       // <-- required
//     title: "Results"
// });});
router.get("/results", async (req, res) => {
  try {
    // 1. Find election timing (if you added timing logic)
    const election = await Election.findOne();

    const now = new Date();

    if (!election) {
      return res.send("election timings not set by admin");
    }

    // 2. Allow results only after election ends
    if (now < election.endTime) {
      return res.send("Results will be declared after the election ends.");
    }

    // 3. Fetch candidates sorted by highest votes
    const candidates = await Candidate.find().sort({ votes: -1 });

    // 4. Render the results page with candidates
    res.render("user/results", { 
      candidates: candidates,
      winner: candidates[0],   // Top voted candidate
      title: "election Results"
    });

  } catch (err) {
    console.log(err);
    res.send("Something went wrong");
  }
});




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
router.get("/admin/addcandidates", jwtAuthMiddleware, async (req, res) => {
    const user = await User.findById(req.user.userId);
    if (user.role !== "admin") {
    return res.status(403).send("Access Denied");
}

    res.render("admin/addcandidates", { title: "Add Candidate", user,message:null });
});


/*----get all users(voters)----*/
router.get("/admin/voterlist", jwtAuthMiddleware, async (req, res) => {
    const loggedInUser = await User.findById(req.user.userId);//ye isliye use kia hai kyu k hum req.user me sirf id rakhte hai

    if (!loggedInUser || loggedInUser.role !== "admin") {
        return res.status(403).send("Access Denied");
    }

    const voters = await User.find();

    res.render("admin/voterlist", {
        title: "Voters List",
        voters,
        message: "List of all users"
    });
});


//EDIT CANDIDATE PAGE
router.get("/admin/editcandidate/:id", jwtAuthMiddleware, async (req, res) => {
    console.log("data");
    const user = await User.findById(req.user.userId);
    if (user.role !== "admin") {
    return res.status(403).send("Access Denied");
}

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
        return res.status(404).send("Candidate not found");
    }
    res.render("admin/editcandidate", { candidate, title: "Edit Candidate", user});
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




router.get("/admin/setelection",jwtAuthMiddleware, async (req, res) => {
      console.log("🔥 Route Hit: /admin/setelection");   // <--- add this

      const user = await User.findById(req.user.userId);

  if (user.role !== "admin") {
    return res.status(403).send("Access Denied");
  }

  res.render("admin/setelection", { title: "Set Election Time" });
});

router.post("/admin/setelection",jwtAuthMiddleware, async (req, res) => {
  const { startTime, endTime } = req.body;
console.log("Time receive");
  await Election.deleteMany();
  await Election.create({ startTime, endTime });

  res.send("Election time set successfully!");
});



module.exports = router;
