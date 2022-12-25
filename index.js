const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

// mongodb

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0zgm21v.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const homesCollection = client.db("air-bnb").collection("homes");
    const usersCollection = client.db("air-bnb").collection("users");

    // save user email and generate jwt
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const user = req.body;
      console.log(user);
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
