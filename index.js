const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { decode } = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_TOKEN);
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
    const paymentCollection = await client
      .db('computer-parts')
      .collection('payment');
    const reviewCollection = await client
      .db('computer-parts')
      .collection('reviews');

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const user = await userCollection.findOne({ email: email });
      if (user.role === 'admin') {
        next();
      } else {
        res.status(403).send({ message: 'Forbidden Access' });
      }
    };

    app.get('/review', async (req, res) => {
      const reviews = await reviewCollection.find().toArray();
      res.send(reviews);
    });

    app.post('/review', verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    app.get('/admin/:email',verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      if (!user) return res.send({ message: 'user not found' });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin });
    });

    app.put('/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
      const authHeader = req.headers.authorization;
      console.log(authHeader);
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: 'admin',
        },
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    app.get('/user', verifyJWT, verifyAdmin, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.get('/user/:email',verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      res.send(user);
    });

    app.put('/user/updateProfile/:email',verifyJWT, async (req, res) => {
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
      res.send(result);
    });

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

    app.post('/parts', verifyJWT, verifyAdmin, async (req, res) => {
      const parts = req.body;
      const result = await partsCollection.insertOne(parts);
      res.send(result);
    });

    app.get('/parts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const parts = await partsCollection.findOne(query);
      res.send(parts);
    });

    app.delete('/parts/:id', verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await partsCollection.deleteOne(query);
      res.send(result);
    });

    app.get('/purchase',verifyJWT, async (req, res) => {
      const email = req.query.email;
      const purchase = await purchaseCollection
        .find({ buyer: email })
        .toArray();
      res.send(purchase);
    });

    app.get('/purchase/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const purchase = await purchaseCollection.findOne(query);
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

    app.put(
      '/purchase/status/:id',
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updatedDoc = {
          $set: {
            status: 'Shipped',
          },
        };
        const result = await purchaseCollection.updateOne(
          query,
          updatedDoc,
          options
        );
        res.send(result);
      }
    );

    app.patch('/purchase/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };

      const result = await paymentCollection.insertOne(payment);
      const updatedPurchase = await purchaseCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(updatedPurchase);
    });

    app.delete('/purchase/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await purchaseCollection.deleteOne(query);
      res.send(result);
    });

    app.get('/order', verifyJWT, verifyAdmin, async (req, res) => {
      const orders = await purchaseCollection.find().toArray();
      res.send(orders);
    });

    app.put('/order/purchase/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const purchase = await purchaseCollection.findOne(query);
      const filter = { _id: ObjectId(purchase.productId) };
      const parts = await partsCollection.findOne(filter);
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          ...parts,
          availableQuantity: +parts.availableQuantity + +purchase.quantity,
        },
      };
      const result = await partsCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // PAYMENT
    app.post('/create-payment-intent',verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
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
