const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Candidate = require('../models/candidate');
const Election = require("../models/election");
const { jwtAuthMiddleware } = require('../jwt');


/*-------- Check Admin Role (ye check karega ki user admin hai ya nahi) --------*/
const checkAdminRole = async (userId) => {
    try {
        const user = await User.findById(userId);
        return user.role === 'admin';
    } catch (err) {
        return false;
    }
};


/*-------- Create New Candidate (sirf admin add kar sakta hai) --------*/
router.post('/', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!await checkAdminRole(req.user.userId)) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        /*-------- ye req.body me jo data aaya hai, usse new candidate banega --------*/
        const newCandidate = new Candidate(req.body);
        const response = await newCandidate.save();   /*-------- ye DB me candidate save karega --------*/

        return res.render("admin/addcandidates", {
            title: "Add Candidate",
            message: "Candidate added successfully",
            response
        });

    } catch (err) {
        console.log('Error while adding candidate:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


/*-------- Update Candidate (admin candidate details update karega) --------*/
router.put('/:candidateId', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!await checkAdminRole(req.user.userId)) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const candidateId = req.params.candidateId;  /*-------- ye candidate ki ID hai --------*/
        const updatedCandidateData = req.body;       /*-------- ye req.body me updated data milega --------*/

        /*-------- ye function candidate ko update karega --------*/
        const response = await Candidate.findByIdAndUpdate(
            candidateId,
            updatedCandidateData,
            { new: true, runValidators: true }
        );

        if (!response) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        console.log("Candidate updated");

        const candidates = await Candidate.find();   /*-------- ye updated list fetch karega --------*/
        const role = req.user.role;

        return res.render("user/candidatelist", {
            title: "Candidate List",
            message: "Candidate updated successfully",
            candidates,
            role
        });

    } catch (err) {
        console.log("Update Error:", err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


/*-------- Delete Candidate (admin candidate ko delete karega) --------*/
router.get('/deleteCandidate/:candidateId', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!await checkAdminRole(req.user.userId)) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const candidateId = req.params.candidateId;  /*-------- ye candidate ki ID hai --------*/

        /*-------- ye candidate ko database se delete karega --------*/
        const response = await Candidate.findByIdAndDelete(candidateId);

        if (!response) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const candidates = await Candidate.find();
        const role = req.user.role;

        return res.render("user/candidatelist", {
            title: "Candidate List",
            candidates,
            role
        });

    } catch (err) {
        console.log("Delete Error:", err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


/*-------- Voting Logic (user vote karega, admin nahi) --------*/
router.post('/vote/:candidateId', jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        const candidateId = req.params.candidateId;
        const election = await Election.findOne();
        const now = new Date();

        // Election checks
        if (!election) return res.send("Election timing not set!");
        if (now < election.startTime) return res.send("Election has not started yet!");
        if (now > election.endTime) return res.send("Election has ended!");

        // No admin voting
        if (user.role === 'admin') {
            return res.send("Admin vote nahi de sakta.");
        }

        // Simple already voted check  
        if (user.isVoted === true) {
            return res.redirect("/thankyou");   // user already voted
        }

        // Vote +1
        await Candidate.findByIdAndUpdate(candidateId, { $inc: { voteCount: 1 } });

        // Mark user as voted
        user.isVoted = true;
        user.votedfor = candidateId;
        await user.save();

        return res.redirect("/thankyou");

    } catch (err) {
        console.log("Voting error:", err);
        res.send("Error in voting");
    }
});



/*-------- Vote Counts (ye result descending order me dega) --------*/
router.get("/vote/counts", async (req, res) => {
    try {
        const candidates = await Candidate.find().sort({ voteCount: "desc" });

        /*-------- voteRecords array banayega --------*/
        const voteRecords = candidates.map((c) => ({
            party: c.party,
            count: c.voteCount
        }));

        res.status(200).json({
            voteRecords,
            message: "Vote counts fetched successfully"
        });

    } catch (err) {
        console.log('Vote Count Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// /*-------- Set Election Time (admin election ka start & end time set karega) --------*/
// router.post("/admin/setelection", async (req, res) => {
//     const { startTime, endTime } = req.body;

//     await Election.deleteMany();   /*-------- purane election ko delete karega --------*/
//     await Election.create({ startTime, endTime });

//     res.send("Election time set successfully!");
// });


module.exports = router;
