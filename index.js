const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { decode } = require('jsonwebtoken');
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

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).send({ message: 'Unauthorized Access' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).send({ message: 'Forbidden Access' });
    req.decoded = decoded;
    next();
  });
};

const run = async () => {
  try {
    await client.connect();

    const partsCollection = await client
      .db('computer-parts')
      .collection('parts');
    const userCollection = await client.db('computer-parts').collection('user');
    const purchaseCollection = await client
      .db('computer-parts')
      .collection('purchases');

    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      if (!user) return res.send({ message: 'user not found' });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin });
    });

    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      res.send(user);
    });

    app.put('/user/updateProfile/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          ...user,
          role: '',
        },
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          ...user,
          role: '',
        },
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

    app.get('/parts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const parts = await partsCollection.findOne(query);
      res.send(parts);
    });

    app.get('/purchase', async (req, res) => {
      const email = req.query.email;
      const purchase = await purchaseCollection
        .find({ buyer: email })
        .toArray();
      res.send(purchase);
    });

    app.put('/purchase', async (req, res) => {
      const purchase = req.body;
      const options = { upsert: true };
      const query = { _id: ObjectId(purchase.productId) };
      const parts = await partsCollection.findOne(query);
      if (parts.availableQuantity >= purchase.quantity) {
        const newAvailableQuantity =
          parts.availableQuantity - purchase.quantity;
        const updatedDoc = {
          $set: {
            availableQuantity: newAvailableQuantity,
          },
        };

        const update = await partsCollection.updateOne(
          query,
          updatedDoc,
          options
        );
        const result = await purchaseCollection.insertOne(purchase);
        res.send(result);
      } else {
        res.send({ message: 'No Parts Found' });
      }
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
