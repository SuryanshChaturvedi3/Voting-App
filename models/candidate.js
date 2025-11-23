const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
     name:{
         type: String,
         required: true
     },
        party:{
        type: String,
        required: true
    },
    age:{
        type: Number,
        required: true
    },
    gender:{
        type: String,
        required: true
    },

    votes:[
         {
            user:{
            type: mongoose.Schema.Types.ObjectId, // ye field un users ke IDs ko store karega jinhone is candidate ko vote diya hai 
            ref: 'User',  // isko User model se reference karta hai taaki pata chale ki kaunse users ne is candidate ko vote diya hai
            required: true,
        },
        
            votedAt: {
                type: Date,
                default: Date.now // ye field vote dene ka time track karega
            }
        },
    ],

    voteCount:{
        type: Number,
        default: 0 // Initially, the candidate has zero votes
    }
},{ timestamps: true });// Automatically adds createdAt and updatedAt fields)


const Candidate = mongoose.model('Candidate', candidateSchema);
module.exports= Candidate;