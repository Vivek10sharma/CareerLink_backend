const bcrypt = require('bcryptjs');
const Candidate = require('../models/Candidate');
const Recruiter = require('../models/Recruiter');
const jwt = require('jsonwebtoken');

// Register a new user
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    if (!role || (role !== 'candidate' && role !== 'recruiter')) {
      return res.status(400).json({ msg: 'Role must be either "candidate" or "recruiter"' });
    }

    const UserModel = role === 'candidate' ? Candidate : Recruiter;

    // Check if user already exists
    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new user
    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ msg: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully` });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ msg: 'Please provide email, password, and role' });
    }

    const UserModel = role === 'candidate' ? Candidate : Recruiter;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = { userId: user._id, role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.status(200).json({
      msg: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Logout user
const logout = (req, res) => {
  try {
    // Since no session is used, just instruct client to delete token
    res.status(200).json({ message: 'Logged out successfully (client should delete token)' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ error: 'Something went wrong during logout' });
  }
};

module.exports = {
  register,
  login,
  logout
};
