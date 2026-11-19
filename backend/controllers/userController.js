import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Route for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: "Please enter both email and password" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await userModel.findOne({ email: normalizedEmail });

        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = createToken(user._id);
        res.json({ success: true, token });
    } catch (error) {
        console.error("Login error:", error);
        res.json({ success: false, message: "Error logging in" });
    }
}

// Route for user registration
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. Username / Name validation
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return res.json({ success: false, message: "Please enter a valid name (at least 2 characters)" });
        }

        if (name.trim().length > 50) {
            return res.json({ success: false, message: "Name cannot exceed 50 characters" });
        }

        // 2. Email validation
        if (!email || typeof email !== "string" || !validator.isEmail(email.trim())) {
            return res.json({ success: false, message: "Please enter a valid email address" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check for existing user
        const exists = await userModel.findOne({ email: normalizedEmail });
        if (exists) {
            return res.json({ success: false, message: "User already exists with this email" });
        }

        // 3. Password validation
        if (!password || typeof password !== "string" || password.trim().length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" });
        }

        // Hash user password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        const user = await newUser.save();
        const token = createToken(user._id);

        res.json({ success: true, token });

    } catch (error) {
        console.error("Registration error:", error);
        res.json({ success: false, message: error.message || "Error creating account" });
    }
}

// Route to get user profile
const getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        res.json({ success: true, userData: user });
    } catch (error) {
        console.error("Get profile error:", error);
        res.json({ success: false, message: "Error fetching profile" });
    }
}

// Route to update user profile
const updateProfile = async (req, res) => {
    try {
        const { name, email, oldPassword, password, image } = req.body;
        const userId = req.userId;

        const updateData = {};

        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length < 2) {
                return res.json({ success: false, message: "Name must be at least 2 characters long" });
            }
            updateData.name = name.trim();
        }

        if (email !== undefined) {
            if (typeof email !== "string" || !validator.isEmail(email.trim())) {
                return res.json({ success: false, message: "Please enter a valid email address" });
            }
            const normalizedEmail = email.trim().toLowerCase();
            const existing = await userModel.findOne({ email: normalizedEmail, _id: { $ne: userId } });
            if (existing) {
                return res.json({ success: false, message: "Email is already taken by another account" });
            }
            updateData.email = normalizedEmail;
        }

        if (!image && req.file) {
            updateData.image = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
        } else if (image) {
            updateData.image = image;
        }

        if (password) {
            if (typeof password !== "string" || password.trim().length < 8) {
                return res.json({ success: false, message: "New password must be at least 8 characters long" });
            }
            if (!oldPassword) {
                return res.json({ success: false, message: "Please enter your current password" });
            }

            // Verify old password
            const currentUser = await userModel.findById(userId);
            const isMatch = await bcrypt.compare(oldPassword, currentUser.password);

            if (!isMatch) {
                return res.json({ success: false, message: "Incorrect current password" });
            }

            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        const user = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({ success: true, message: "Profile Updated", userData: user });

    } catch (error) {
        console.error("Update profile error:", error);
        res.json({ success: false, message: error.message || "Error updating profile" });
    }
}

export { loginUser, registerUser, getProfile, updateProfile };
