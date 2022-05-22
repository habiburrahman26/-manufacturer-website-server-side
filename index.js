const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x82pw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();

    const partsCollection = await client
      .db('computer-parts')
      .collection('parts');
    const userCollection = await client.db('computer-parts').collection('user');

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );

      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: '2h',
        }
      );
      res.send({ accessToken: token });
    });

    app.get('/parts', async (req, res) => {
      const parts = await partsCollection.find().toArray();
      res.send(parts);
    });
  } finally {
    // await client.close();
  }
};
run().catch(console.dir);

app.get('/', (_, res) => {
  res.send('server running');
});

app.listen(port, () => {
  console.log('Server is Running', port);
});
