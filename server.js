import express from "express";
import bcrypt, { hash } from "bcrypt";
import cors from "cors";


const app = express();
app.use(express.json());
app.use(cors());

const users = [];

app.get('/users', (req, res) => {
    res.json(users);
});

app.post('/users', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = { name: req.body.name, password: hashedPassword };

        users.push(user);
        res.status(201).send();
    } catch {
        res.status(500).send();
    }
});

app.post('/users/login', async (req, res) => {
    console.log(req.body);

    const user = users.find(user => {
        console.log("Checking user:", user.name, "against", req.body.name);
        return user.name === req.body.name;
    });

    if (user == null){
        console.log('user not found');
        return res.status(400).send("Cannot find user");
    }

    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
            console.log('success');
            res.status(200).send({ message: "Success" });
        } else {
            console.log('failed');
            res.status(401).send("Password Incorrect");
        }
    } catch {
        res.status(500).send();
    }
});

app.listen(3000);