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
    // Validate Twilio configuration
    if (!SID || !AUTH || !FROM) {
      console.error("❌ Twilio not configured properly. Check .env file for TWILIO_SID, TWILIO_AUTH, and TWILIO_NUMBER");
      return { success: false, error: "SMS service not configured" };
    }

    // Validate and format mobile number
    if (!mobile) {
      console.error("❌ Mobile number is missing");
      return { success: false, error: "Mobile number is required" };
    }

    const to = mobile.startsWith("+") ? mobile : `+91${mobile}`;
    console.log("📱 Attempting to send OTP to:", to, "| OTP:", otp);

    const msg = await client.messages.create({
      body: `Your OTP for password reset is ${otp}. Valid for 5 minutes.`,
      // If you use a Messaging Service, set messagingServiceSid instead of from.
      ...(FROM && FROM.startsWith("MG") ? { messagingServiceSid: FROM } : { from: FROM }),
      to,
    });

    console.log("✅ SMS sent successfully:", { sid: msg.sid, status: msg.status, to: msg.to });
    return { success: true, messageId: msg.sid, status: msg.status };
  } catch (error) {
    // Twilio error object often contains more fields
    console.error("❌ OTP sending failed:", {
      message: error.message,
      code: error.code,
      more: error.moreInfo || error.more || null,
      status: error.status
    });

    // Check for common Twilio trial errors
    if (error.code === 21608) {
      console.error("⚠️  TWILIO TRIAL LIMITATION: The number", mobile, "is not verified.");
      console.error("   Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified and add this number.");
    }

    return { success: false, error: error.message, code: error.code };
  }
}

module.exports = sendOTP;
