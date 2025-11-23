const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const frontendRoutes = require('./routes/frontend');
const candidateRoutes = require('./routes/candidatesRoutes');
require('dotenv').config();
const methodOverride = require("method-override");
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser'); 

const PORT = 3000;


/*--------Database Connection Setup--------*/
mongoose
       .connect('mongodb://127.0.0.1:27017/votingApp')
       .then(() => console.log(' MongoDB Connected '))
       .catch((err) => console.error('Error connecting to MongoDB:', err));



/*----------Middleware Functions----------*/

app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded request bodies
app.use(cookieParser()); // Middleware to parse cookies
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory


/*------set view engine------*/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');





app.use(methodOverride("_method")); //ise hum PUT or DELETE request bhej skte hai form se aur route se phle lagate hai


/*----------Route Setup----------*/
app.use('/', frontendRoutes); // Use frontend routes for root requests
app.use('/user', userRoutes); // Use user routes for any requests to /users
app.use('/candidate' ,candidateRoutes); // Use candidate routes for any requests to /candidate



/*---Start the Server---*/
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 