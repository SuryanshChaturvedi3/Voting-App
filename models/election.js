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
    status: {
  type: String,
  enum: ["not_started", "ongoing", "ended", "stopped"],
  default: "not_started"
}

});

    module.exports = mongoose.model("Election", electionSchema);