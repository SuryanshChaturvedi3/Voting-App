const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = 'mySecretKey123'; // Use env file in production

/*--------Generate JWT Token--------*/
const generateToken = (payload) => {
    return jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });
}


/*--------JWT Authentication Middleware--------*/
const jwtAuthMiddleware = (req, res, next) => {
    try {
        // 1) Read token from cookies (NOT from header)
        const token = req.cookies.token;

        if (!token) {
            return res.redirect('/login');   // If no cookie → login page
        }

        // 2) Verify token
        const decoded = jwt.verify(token, SECRET_KEY);

        // 3) Store user info inside req.user
        req.user = decoded;

        next();   // Move ahead
    } 
    catch (err) {
        console.log("Token error:", err);
        return res.redirect('/login');  // Invalid token → login page
    }
};

module.exports = { generateToken, jwtAuthMiddleware };
