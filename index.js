/*-------------Basic Setup------------------*/
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const userRoutes = require('./routes/userRoutes');
const frontendRoutes = require('./routes/frontend');
const candidateRoutes = require('./routes/candidatesRoutes');
const methodOverride = require("method-override");
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT;


/*-------------Database Connection------------------*/
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log(' MongoDB Connected '))
  .catch((err) => console.error('Error connecting to MongoDB:', err));


/*-------------Middlewares------------------*/
app.use(express.json());                           // Parse JSON
app.use(express.urlencoded({ extended: true }));   // Parse form data
app.use(cookieParser());                           // Read cookies
app.use(express.static(path.join(__dirname, 'public'))); // Public folder

app.use(expressLayouts);                           // Use layouts
app.set('layout', 'layout');                       // Default layout

app.use(methodOverride("_method")); // PUT & DELETE enable from forms


/*-------------View Engine Setup------------------*/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


/*-------------Routes Setup------------------*/
app.use('/', frontendRoutes);
app.use('/user', userRoutes);
app.use('/candidate', candidateRoutes);


/*-------------Start Server------------------*/
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
