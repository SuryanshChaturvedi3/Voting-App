const express = require('express');
const router = express.Router();
const User = require('../models/user');        // For checking admin
const Candidate = require('../models/candidate');  // Candidate model
const {  jwtAuthMiddleware } = require('../jwt');


/*-------Check Admin---------*/
const checkAdminRole = async(userId) => {
    try {
        const user = await User.findById(userId);
        return user.role === 'admin';
    } catch (err) {
        return false;
    }
};
/*----------Create new Candidate----------*/
router.post('/', jwtAuthMiddleware,async (req, res) => {
    try {
        if(!await checkAdminRole(req.user.userId)){
            return  res.status(403).json({ message: 'Access denied. Admins only.' });
        }
     

        /*create new user-*/
        const data = req.body;
        const newCandidate = new Candidate(data);
       const response =  await newCandidate.save(); // ye user ko database me save karega
        console.log('data saved successfully');  
           return res.render("admin/addCandidates", { title: "Add Candidate", message: "Candidate added successfully" ,response});
            
    } 
    catch (err) {
        console.log('Error during user signup:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


/*--------Candidate Update Route--------*/
router.put('/:candidateId', jwtAuthMiddleware, async (req, res) => {
    try {
                if(!await checkAdminRole(req.user.userId)){
            return  res.status(403).json({ message: 'Access denied. Admins only.' });
           

        }

       const candidateId = req.params.candidateId;// ye user ka ID hai
        const updatedCandidateData = req.body; // ye req.body me updated data milega

        // Find candidate by ID and update
        const response = await Candidate.findByIdAndUpdate(candidateId, updatedCandidateData,
             {
                 new: true, // Return the updated document and automatically save in database
                 runValidators: true // Ensure updated data adheres to schema
             });

        if (!response) {
            return res.status(404).json({ message: 'Candidate not found'});
        }
        console.log("Data updated");
 const candidates = await Candidate.find();
    const role = req.user.role;               // from JWT

        return res.render("user/candidateList", {
            title: "Candidate List",
            message: "Candidate updated successfully",
            candidates,
            role
        });
     } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});


/*--------Candidate Delete Route--------*/
router.get('/deleteCandidate/:candidateId',jwtAuthMiddleware, async (req, res) => {
    try {
                if(!await checkAdminRole(req.user.userId)){
            return  res.status(403).json({ message: 'Access denied. Admins only.' });
        }

       const candidateId = req.params.candidateId;// ye user ka ID hai
        //const updatedCandidateData = req.body; // ye req.body me updated data milega

        // Find candidate by ID and update
        const response = await Candidate.findByIdAndDelete(candidateId);
          const candidates = await Candidate.find();
       const role = req.user.role;               // from JWT
        if (!response) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        console.log('data deleted');
res.render("user/candidateList", {
    title: "Candidate List",
    candidates,
    role,
    
});    }
     catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});


/*-------Its Voting Day?---------*/
router.post('/vote/:candidateId', jwtAuthMiddleware,async (req, res) => {
    try {
        const candidateId = req.params.candidateId;
        const userId = req.user.userId;

        // Check if candidate exists
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found.' });
        }
         // Check if user exists
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({ message: 'User not found.' });
        }

        //user can vote only once
        if(user.isVoted){
            return res.redirect("/thankyou");
        }
        //Admin cannot vote
        if(user.role === 'admin'){
            return res.status(403).json({ message: 'Admins are not allowed to vote.' });
        }
       
       //update candidate's votes and voteCount
       candidate.votes.push({ user: userId });  // isse user ka vote add hoga and votes array me ek naya entry banega
       candidate.voteCount += 1;     // increment vote count
         await candidate.save();

     //update user's isVoted status
       user.isVoted = true;// isse user ka vote dene ka status true ho jayega
       await user.save();
        return res.redirect("/thankyou");


    } 
    catch (err) {
        console.log('Error during voting:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


/*-----------------Vote CountS-----------------*/

router.get("/vote/counts",  async(req,res)=>{
    try{
        const candidates = await Candidate.find().sort({voteCount:"desc"});// ye sabhi candidates ko voteCount ke hisab se descending order me laega
           
        //vote records ke sath response bhejna
        const voteRecords = candidates.map((data)=>{
            return {
            party: data.party,
           count: data.voteCount
        }
    });
        res.status(200).json({voteRecords, message:"Vote counts fetched successfully"});
 }catch(err){
    console.log('Error during fetching vote counts:', err);
        res.status(500).json({ message: 'Internal server error' });
 }
    
});

/*-----------------Get All Candidates-----------------*/
// router.get("/candidateList", async(req,res)=>{
//     const candidates = await Candidate.find();
//    // console.log(candidate);
//      res.render("user/candidateList", { title: "Candidates", user, candidates });
// });


module.exports = router;
