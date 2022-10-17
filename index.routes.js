import express from 'express'
const userRouter = require("./users/users.routes");

const router = express.Router();

router.use("/api/v1/user", userRouter);

module.exports = router;

// const express = require("express");

// const router = express.Router();
// module.exports = (collection) => {

//   const verifyJWT = (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     if (!authHeader)
//       return res.status(401).send({ message: "Unauthorized Access" });

//     const token = authHeader.split(" ")[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//       if (err) return res.status(403).send({ message: "Forbidden Access" });
//       req.decoded = decoded;
//       next();
//     });
//   };

//   const verifyAdmin = async (req, res, next) => {
//     const email = req.decoded.email;
//     const user = await collection.userCollection.findOne({ email: email });
//     if (user.role === "admin") {
//       next();
//     } else {
//       res.status(403).send({ message: "Forbidden Access" });
//     }
//   };

//   router.get("/admin/:email", verifyJWT, async (req, res) => {
//     const email = req.params.email;
//     const user = await userCollection.findOne({ email });
//     if (!user) return res.send({ message: "user not found" });
//     const isAdmin = user.role === "admin";
//     res.send({ admin: isAdmin });
//   });

//   router.put("/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
//     const authHeader = req.headers.authorization;
//     console.log(authHeader);
//     const email = req.params.email;
//     const filter = { email: email };
//     const options = { upsert: true };
//     const updatedDoc = {
//       $set: {
//         role: "admin",
//       },
//     };
//     const result = await userCollection.updateOne(filter, updatedDoc, options);
//     res.send(result);
//   });

//   router.get("/user", async (req, res) => {
//     const users = await userCollection.find().toArray();
//     res.send(users);
//   });

//   router.put("/user/uploadPhoto", async (req, res) => {
//     const id = req.body.id;
//     const img = req.body.img;
//     const filter = { _id: ObjectId(id) };
//     const options = { upsert: true };
//     const updatedDoc = {
//       $set: { img: img },
//     };
//     const result = await userCollection.updateOne(filter, updatedDoc, options);
//     res.send(result);
//   });

//   router
//     .route("/review")
//     .get(async (req, res) => {
//       const reviews = await reviewCollection.find().toArray();
//       res.send(reviews);
//     })
//     .post(async (req, res) => {
//       const review = req.body;
//       const result = await collection.reviewCollection.insertOne(review);
//       res.send(result);
//     });

//   router
//     .route("/purchase")
//     .get(async (req, res) => {
//       const email = req.query.email;
//       const purchase = await purchaseCollection.find({ buyer: email }).toArray();
//       res.send(purchase);
//     })
//     .put(async (req, res) => {
//       const purchase = req.body;
//       const options = { upsert: true };
//       const query = { _id: ObjectId(purchase.productId) };
//       const parts = await partsCollection.findOne(query);
//       if (parts.availableQuantity >= purchase.quantity) {
//         const newAvailableQuantity = parts.availableQuantity - purchase.quantity;
//         const updatedDoc = {
//           $set: {
//             availableQuantity: newAvailableQuantity,
//           },
//         };

//         const update = await partsCollection.updateOne(
//           query,
//           updatedDoc,
//           options
//         );
//         const result = await purchaseCollection.insertOne(purchase);
//         res.send(result);
//       } else {
//         res.send({ message: "No Parts Found" });
//       }
//     });

//   router.get("/order", async (req, res) => {
//     const orders = await purchaseCollection.find().toArray();
//     res.send(orders);
//   });

//   router.post("/create-payment-intent", async (req, res) => {
//     const service = req.body;
//     const price = service.price;
//     const amount = price * 100;
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: amount,
//       currency: "usd",
//       payment_method_types: ["card"],
//     });
//     res.send({ clientSecret: paymentIntent.client_secret });
//   });

//   router
//     .route("/parts")
//     .get(async (req, res) => {
//       const parts = await partsCollection.find().toArray();
//       res.send(parts);
//     })
//     .post(async (req, res) => {
//       const parts = req.body;
//       const result = await partsCollection.insertOne(parts);
//       res.send(result);
//     });

//   router
//     .route("/user/:email")
//     .get(async (req, res) => {
//       const email = req.params.email;
//       const user = await userCollection.findOne({ email });
//       res.send(user);
//     })
//     .put(async (req, res) => {
//       const email = req.params.email;
//       const user = req.body;
//       const filter = { email: email };
//       const options = { upsert: true };
//       const updatedDoc = {
//         $set: user,
//       };
//       const result = await userCollection.updateOne(filter, updatedDoc, options);

//       const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
//         expiresIn: "2h",
//       });
//       res.send({ accessToken: token });
//     });

//   router.put("/user/updateProfile/:email", async (req, res) => {
//     const email = req.params.email;
//     const user = req.body;
//     const filter = { email: email };
//     const options = { upsert: true };
//     const updatedDoc = {
//       $set: user,
//     };
//     const result = await userCollection.updateOne(filter, updatedDoc, options);
//     res.send(result);
//   });

//   router
//     .route("/parts/:id")
//     .get(async (req, res) => {
//       const id = req.params.id;
//       const query = { _id: ObjectId(id) };
//       const parts = await partsCollection.findOne(query);
//       res.send(parts);
//     })
//     .delete(async (req, res) => {
//       const id = req.params.id;
//       const query = { _id: ObjectId(id) };
//       const result = await partsCollection.deleteOne(query);
//       res.send(result);
//     });

//   router
//     .route("/purchase/:id")
//     .get(async (req, res) => {
//       const id = req.params.id;
//       const query = { _id: ObjectId(id) };
//       const purchase = await purchaseCollection.findOne(query);
//       res.send(purchase);
//     })
//     .patch(async (req, res) => {
//       const id = req.params.id;
//       const payment = req.body;
//       const filter = { _id: ObjectId(id) };
//       const updatedDoc = {
//         $set: {
//           paid: true,
//           transactionId: payment.transactionId,
//         },
//       };

//       const result = await paymentCollection.insertOne(payment);
//       const updatedPurchase = await purchaseCollection.updateOne(
//         filter,
//         updatedDoc
//       );
//       res.send(updatedPurchase);
//     })
//     .delete(async (req, res) => {
//       const id = req.params.id;
//       const query = { _id: ObjectId(id) };
//       const result = await purchaseCollection.deleteOne(query);
//       res.send(result);
//     });

//   router.get("/order/:id", async (req, res) => {
//     const id = req.params.id;
//     const orders = await purchaseCollection.findOne({ id }).toArray();
//     res.send(orders);
//   });

//   router.put("/order/purchase/:id", async (req, res) => {
//     const id = req.params.id;
//     const query = { _id: ObjectId(id) };
//     const purchase = await purchaseCollection.findOne(query);
//     const filter = { _id: ObjectId(purchase.productId) };
//     const parts = await partsCollection.findOne(filter);
//     const options = { upsert: true };
//     const updatedDoc = {
//       $set: {
//         ...parts,
//         availableQuantity: +parts.availableQuantity + +purchase.quantity,
//       },
//     };
//     const result = await partsCollection.updateOne(filter, updatedDoc, options);
//     res.send(result);
//   });
//   return router;
// };
