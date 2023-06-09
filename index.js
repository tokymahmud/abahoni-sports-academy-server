const express =require('express');
const app =express();
const cors =require('cors');
const port =process.env.PORT || 5000;
require('dotenv').config()



app.use(cors());
app.use(express.json());


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

    app.post('/users', async(req,res)=>{
        const user=req.body;
        const result =await usersCollection.insertOne(user);
        res.send(result);

    })

    app.get('/classes', async(req,res)=>{
        const result = await classesCollection.find().toArray();
        res.send(result);
    })
    app.get('/instructors', async(req,res)=>{
        const result = await instructorsCollection.find().toArray();
        res.send(result);
    })

    app.get('/sclasses', async(req,res)=>{
        const email= req.query.email;
        console.log(email);
        if(!email){
            res.send([]);
        }
        else {
            try {
              const query = { email: email };
              const result = await sclassesCollection.find(query).toArray();
              res.send(result);
            } catch (error) {
              console.error(error);
            }
          }
        // const query ={email:email};
        // const result =await sclassesCollection.find(query).toArray();
        // res.send(result);

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