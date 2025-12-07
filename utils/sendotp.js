const twilio = require("twilio");
require("dotenv").config();

const SID = process.env.TWILIO_SID;
const AUTH = process.env.TWILIO_AUTH;
const FROM = process.env.TWILIO_NUMBER || process.env.TWILIO_FROM || process.env.TWILIO_MESSAGING_SERVICE_SID;

console.log("TWILIO_SID:", !!SID);
console.log("TWILIO_AUTH:", !!AUTH);
console.log("TWILIO_FROM/NUMBER present?:", !!FROM);

const client = twilio(SID, AUTH);

async function sendOTP(mobile, otp) {
  try {
    const to = mobile.startsWith("+") ? mobile : `+91${mobile}`;
    console.log("Attempting to send OTP", { to, from: FROM, otp });

    const msg = await client.messages.create({
      body: `Your OTP for password reset is ${otp}`,
      // If you use a Messaging Service, set messagingServiceSid instead of from.
      ...(FROM && FROM.startsWith("MG") ? { messagingServiceSid: FROM } : { from: FROM }),
      to,
      statusCallback: `${process.env.APP_URL || 'http://localhost:3000'}/twilio-status`
    });

    console.log("Twilio create() response:", { sid: msg.sid, status: msg.status, to: msg.to });
    return true;
  } catch (error) {
    // Twilio error object often contains more fields
    console.error("OTP Error:", {
      message: error.message,
      code: error.code,
      more: error.more || null,
      status: error.status
    });
    return false;
  }
}

module.exports = sendOTP;
