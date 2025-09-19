const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const jobApplicationRoutes = require('./routes/jobApplicationRoutes');
const cookieParser = require('cookie-parser');
const candidateRoutes = require('./routes/candidateRoutes');





dotenv.config({ path: __dirname + '/.env' })

const app = express();
app.use(cookieParser());

console.log('Mongo URI:', process.env.MONGO_URI); 

app.use(cors());
app.use(express.json());
app.use('/api/recruiter/jobs', jobRoutes);
app.use('/api/applications', jobApplicationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/candidate', candidateRoutes);



mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
