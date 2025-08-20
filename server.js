import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";

// Initialize Firebase
const serviceAccount = JSON.parse(fs.readFileSync('./key.json', 'utf-8'));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(express.json());
app.use(cors());

const db = admin.firestore();

// GET all users (without passwords)
app.get('/users', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const data = snapshot.docs.map(doc => {
            const { password, ...rest } = doc.data(); // remove password
            return {
                id: doc.id,
                ...rest
            };
        });

        res.status(200).send({
            success: true,
            message: 'Users returned',
            data
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error?.message
        });
    }
});

// Register new user
app.post('/users', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({
            success: false,
            message: "Email and password are required"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { email, password: hashedPassword };

        await db.collection('users').add(user);

        res.status(201).send({
            success: true,
            message: 'User added',
            data: { email } // don't send back password
        });
    } catch (error) {
        res.status(500).send({
            success: false,
            message: error?.message
        });
    }
});

// Login user
app.post('/users/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({
            success: false,
            message: "Email and password are required"
        });
    }

    try {
        const userSnapshot = await db.collection('users')
            .where('email', '==', email)
            .get();

        if (userSnapshot.empty) {
            return res.status(400).send({
                success: false,
                message: "User not found"
            });
        }

        const userDoc = userSnapshot.docs[0];
        const user = userDoc.data();

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            return res.status(200).send({
                success: true,
                message: "Login successful"
            });
        } else {
            return res.status(401).send({
                success: false,
                message: "Incorrect password"
            });
        }

    } catch (error) {
        res.status(500).send({
            success: false,
            message: error?.message
        });
    }
});

// Start server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
