const twilio = require("twilio");
require("dotenv").config();

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

async function sendOTP(mobile, otp) {
  try {
    const result = await client.messages.create({
      body: `Your OTP for password reset is ${otp}`,
      from: process.env.TWILIO_NUMBER,  // Twilio number
      to: `+91${mobile}`
    });

    return true;
  } catch (error) {
    console.error("OTP Error:", error);
    return false;
  }
}

module.exports = sendOTP;
