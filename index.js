const express =require('express');
const app =express();
require('dotenv').config()

const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const cors =require('cors');
const port =process.env.PORT || 5000;

const jwt = require('jsonwebtoken');

// console.log(process.env.PAYMENT_SECRET_KEY);



app.use(cors());
app.use(express.json());

const verifyJWT= (req,res,next)=>{
    const authorization =req.headers.authorization;
    if(!authorization){
        return res.status(401).send({error:true, message:'unauthorized access'});

    }
    const token=authorization.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
            return res.status(401).send({error:true, message:'unauthorized access'});
        }
        req.decoded=decoded;
        next();
    })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cjpsvw7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect(); 
    const classesCollection =client.db('Abahoni').collection('classes');
    const usersCollection =client.db('Abahoni').collection('users');
    const instructorsCollection =client.db('Abahoni').collection('instructors');
    const sclassesCollection =client.db('Abahoni').collection('sclasses');
    const paymentCollection =client.db('Abahoni').collection('payments');


    app.post('/jwt',(req,res)=>{
        const user=req.body;
        const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'10d'})
        res.send({token})
    })

    const verifyAdmin = async (req, res, next) => {
        const email = req.decoded.email;
        const query = { email: email }
        const user = await usersCollection.findOne(query);
        if (user?.role !== 'admin') {
          return res.status(403).send({ error: true, message: 'forbidden message' });
        }
        next();
      }
  
    const verifyInstructor = async (req, res, next) => {
        const email = req.decoded.email;
        const query = { email: email }
        const user = await usersCollection.findOne(query);
        if (user?.role !== 'instructor') {
          return res.status(403).send({ error: true, message: 'forbidden message' });
        }
        next();
      }
  


    app.get('/users', verifyJWT,verifyAdmin, async(req,res)=>{
        const result =await usersCollection.find().toArray();
        res.send(result);
    })

    app.post('/users', async(req,res)=>{
        const user=req.body;
        const query ={email:user.email}
        const existinguser =await usersCollection.findOne(query);
        if(existinguser){
            return res.send({message:'user already exists'})
        }
        const result =await usersCollection.insertOne(user);
        res.send(result);

    })
    // ,verifyJWT

    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
        const email = req.params.email;
  
        if (req.decoded.email !== email) {
          res.send({ admin: false })
        }
  
        const query = { email: email }
        const user = await usersCollection.findOne(query);
        const result = { admin: user?.role === 'admin' }
        res.send(result);
      })

      app.patch('/users/admin/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: 'admin'
          },
        };
  
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
  
      })

      

      app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
        const email = req.params.email;
  
        if (req.decoded.email !== email) {
          res.send({ instructor: false })
        }
  
        const query = { email: email }
        const user = await usersCollection.findOne(query);
        const result = { instructor: user?.role === 'instructor' }
        res.send(result);
      })
  
    app.patch('/users/instructor/:id', async(req,res)=>{
        const id =req.params.id;
        const filter ={_id: new ObjectId(id)};
        const updateDoc ={
            $set:{
                role:'instructor'
            },
        };
        const result =await usersCollection.updateOne(filter,updateDoc);
        res.send(result);
    })

    app.get('/classes', async(req,res)=>{
        const result = await classesCollection.find().toArray();
        res.send(result);
    })

    app.post('/classes',verifyJWT, async(req,res)=>{
        const newItem = req.body;
        const result=await classesCollection.insertOne(newItem)
        res.send(result);

    })


    app.post('/classes/:id/feedback', verifyJWT, (req, res) => {
        const { id } = req.params;
        const { message } = req.body;
      
        classesCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $push: { feedback: { message } } },
          { returnOriginal: false },
          (err, updatedClass) => {
            if (err) {
              console.error(err);
              res.status(500).send('Error creating feedback');
            } else {
              res.json(updatedClass.value);
            }
          }
        );
      });

      app.patch('/classes/:id/deny', verifyJWT, verifyAdmin, (req, res) => {
        const { id } = req.params;
      
        classesCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $set: { status: 'denied' } },
          { returnOriginal: false },
          (err, updatedClass) => {
            if (err) {
              console.error(err);
              res.status(500).send('Error denying class');
            } else {
              res.json(updatedClass.value);
            }
          }
        );
      });
      

    app.get('/instructors', async(req,res)=>{
        const result = await instructorsCollection.find().toArray();
        res.send(result);
    })

    // app.get('/sclasses', async(req,res)=>{
    //     const email= req.query.email;
    //     console.log(email);
    //     if(!email){
    //         res.send([]);
    //     }
    //     else {
    //         try {
    //             // things new added.need to check todo
    //             const decodedEmail=req.decoded.email;
    //             if(email!==decodedEmail){
    //                 return res.status(403).send({error:true, message:'forbidded access'})
    //             }
    //           const query = { email: email };
    //           const result = await sclassesCollection.find(query).toArray();
    //           res.send(result);
    //         } catch (error) {
    //           console.error(error);
    //         }
    //       }
    //     // const query ={email:email};
    //     // const result =await sclassesCollection.find(query).toArray();
    //     // res.send(result);

    // });

    app.get('/sclasses', verifyJWT, async (req, res) => {
        const email = req.query.email;
  
        if (!email) {
          res.send([]);
        }
  
        const decodedEmail = req.decoded.email;
        if (email !== decodedEmail) {
          return res.status(403).send({ error: true, message: 'forbidden access' })
        }
  
        const query = { email: email };
        const result = await sclassesCollection.find(query).toArray();
        res.send(result);
      });

    app.post('/sclasses',async(req,res)=>{
      const item=req.body;
      console.log(item);
      const result =await sclassesCollection.insertOne(item);
      res.send(result);
    })
    app.delete('/sclasses/:id', async(req,res)=>{
        const id = req.params.id
        const query ={_id: new ObjectId(id)};
        const result =await sclassesCollection.deleteOne(query);
        res.send(result);
    })

    // payment intent
    app.post('/create-payment-intent', verifyJWT, async (req, res) => {
        const { price } = req.body;
        const amount = parseInt(price * 100);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          payment_method_types: ['card']
        });
  
        res.send({
          clientSecret: paymentIntent.client_secret
        })
      })
    

      app.post('/payments', verifyJWT, async (req, res) => {
        const payment = req.body;
        // const result =await paymentCollection.insertOne(payment);
        // res.send(result);
        const insertResult = await paymentCollection.insertOne(payment);
  
        const query = { _id: { $in: payment.cartItems.map(id => new ObjectId(id)) } }
        const deleteResult = await sclassesCollection.deleteMany(query)
  
        res.send({ insertResult, deleteResult });
      })
       
      
      app.get('/payments', async (req, res) => {
        try {
          const result = await paymentCollection.find().toArray();
          res.send(result);
        } catch (error) {
          console.error(error);
          res.status(500).send('Error retrieving payments');
        }
      });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('abahoni is playimng')
})

app.listen(port,()=>{
    console.log(`Abahoni location is ${port}`)
})