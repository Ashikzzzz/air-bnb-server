const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

// mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0zgm21v.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
// console.log("object");
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const homesCollection = client.db("air-bnb").collection("homes");
    const usersCollection = client.db("air-bnb").collection("users");
    const bookingsCollection = client.db("air-bnb").collection("bookings");
    // console.log("first");

    // save user email and generate jwt
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      console.log("email", email);
      const user = req.body;
      console.log("user info", user);
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_JWT, {
        expiresIn: "1d",
      });
      console.log(token);
      res.send({ result, token });
    });

    // send email for booking
    const sendEmail = (emailData, email) => {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.Email,
          pass: process.env.Password,
        },
      });
      const mailOptions = {
        from: process.env.Email,
        to: email,
        subject: emailData?.subject,
        html: `<p>${emailData?.message}</p>`,
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
          // do something useful
        }
      });
    };

    // get a single user by email
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      console.log(user.role);
      res.send(user);
    });

    // get all user
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    // save booking data
    app.post("/bookings", async (req, res) => {
      const bookings = req.body;
      console.log(bookings);
      const result = await bookingsCollection.insertOne(bookings);
      console.log(result);
      sendEmail(
        {
          subject: "booking successful",
          message: `Booking ID:${result?.insertedId}`,
        },
        bookings?.guestEmail
      );
      res.send(result);
    });

    // get booking user specified data
    app.get("/bookings", async (req, res) => {
      let query = {};
      const email = req.query.email;
      if (email) {
        query = {
          guestEmail: email,
        };
      }
      const bookings = await bookingsCollection.find(query).toArray();
      console.log(bookings);
      res.send(bookings);
    });
    // get all booking data
    app.get("/bookings", async (req, res) => {
      console.log(req.query);
      const query = {};
      const cursor = await bookingsCollection.find(query).toArray();
      res.send(cursor);
    });

    // add a home
    app.post("/homes", async (req, res) => {
      const homes = req.body;
      console.log(homes);
      const result = await homesCollection.insertOne(homes);
      console.log(result);
      res.send(result);
    });

    // get all home
    app.get("/homes", async (req, res) => {
      const query = {};
      const cursor = await homesCollection.find(query).toArray();
      res.send(cursor);
    });

    // get a single home
    app.get("/home/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const home = await homesCollection.findOne(query);
      console.log(home);
      res.send(home);
    });
  } finally {
  }
}
run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("air-bnb is running");
});

app.listen(port, () => {
  console.log(`port is running ${port}`);
});
