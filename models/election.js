const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema({
 startTime: {
   type: Date,
   required: true,  
    },
    endTime: {
      type: Date,
      required: true,
    },
});

    module.exports = mongoose.model("election", electionSchema);