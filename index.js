const  express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');

require('dotenv').config();
const stripe = require('stripe')(process.env.PAYEMENT_SECRET_KEY)

const port = process.env.PORT || 5000;

// MIDDLEWARE
 app.use(cors());
 app.use(express.json())

console.log(process.env.res_USER);


 const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const { default: Stripe } = require('stripe');
//  const uri =`mongodb+srv://${process.env.res_USER}:${process.env.res_PASS}@cluster0.7ijeqqy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const uri = `mongodb+srv://${process.env.res_USER}:${process.env.res_PASS}@cluster0.rnj2e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
 
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
       
       const menuCollection = client.db('cookingBird').collection('menu');
       const paymentCollection = client.db('cookingBird').collection(' payment');
       const userCollection = client.db('cookingBird').collection('users');
       const reviewCollection = client.db('cookingBird').collection('review');
       const cartCollection = client.db('cookingBird').collection('carts');
      

          // middleware for token verify______
     const verifyToken=(req,res,next)=>{
      console.log('inside verify token', req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({message:'forbidden access'})
      }
      const token = req.headers.authorization.split(" ")[1];
       jwt.verify(token,process.env.TOKEN_SECRET, (err,decoded)=>{
        if(err){
          return res.status(401).send({message:'forbidden access'})
        }
        req.decoded = decoded;
        next();
       })
     }
  // only admin can use apii______(admin or not check)
     const verifyAdmin = async(req,res,next)=>{
      const email = req.decoded.email;
      const query = {email: email}
      const user = await userCollection.findOne(query);
      isAdmin = user?.role==='admin'
      if(!isAdmin){
         return res.status(401).send({message: 'unauthorized access'})
      }
      next();
     }



       app.get('/menu', async(req,res)=>{
         const result = await menuCollection.find().toArray();
         res.send(result);
       })

      // apii for____: admin add  new data to the db
      app.post('/menu',verifyToken,verifyAdmin, async(req,res)=>{
        const item = req.body;
        const result = await menuCollection.insertOne(item);
        res.send(result);
      })

      // api for admin delete menu 
      app.delete('/menu/:id', verifyToken, verifyAdmin, async(req,res)=>{
        const id = req.params.id;
        // const query = {_id: new ObjectId (id)};
        const result = await menuCollection.deleteOne({_id: id});
        res.send(result);
      })

      // api for update menu item(admin)
      app.get('/menu/:id', async(req,res)=>{
        const id = req.params.id;
        // console.log("Idddd = ", id)
        const query = {_id: new ObjectId(id)};
        const result = await menuCollection.findOne(query)
        // console.log("result = ", result)
        res.send(result);
      })

      // Get Single menu with id 
      // app.get('/menu/:id', async (req, res) => {
      //   try {
      //     const _id = req.params.id;

      //     const result = await menuCollection.findOne({ _id });
      //     if (!result) {
      //       return res.status(404).send({ message: "Item not found" });
      //     }
      //     res.send(result);
      //   } catch (error) {
      //     res.status(500).send({ error: "An error occurred while fetching the item" });
      //   }
      // });
      
      

      // api for update menu (admin)
      app.patch('/menu/:id', async(req,res)=>{
        const item = req.body;
        const id = req.params.id;
        // const filter = {_id: new ObjectId(id)}
        const filter = {_id: id}
        const updateDoc ={
          $set:{
            name: item.name,
            price: item.price,
            category: item.category,
            image: item.image,
            recipe: item.recipe

          }
        }
        const result = await menuCollection.updateOne(filter, updateDoc);
        res.send(result)
      })

       app.get('/review', async(req,res)=>{
         const result = await reviewCollection.find().toArray();
         res.send(result);
       })


       app.get('/carts', async(req,res)=>{
        const email = req.query.email;
        console.log(email);
        const query = { email: email };
        console.log(query);
        const result = await cartCollection.find(query).toArray();
        res.send(result)
      })

      //  sending user daata to db
      app.post('/carts', async(req,res)=>{
        const    cartItem  = req.body;
        const result = await cartCollection.insertOne(cartItem);
        console.log('in result', result);
        res.send(result)
      })
      // delete item
      app.delete('/carts/:id', async(req,res)=>{
        const id = req.params.id;
        const query ={_id: new ObjectId(id)}
        const result = await cartCollection.deleteOne(query);
        res.send(result);
      })
      
      // to save user info in db
      app.post('/users', async(req,res)=>{
         const user = req.body;
         const query = {email: user.email}
         const existingUser = await userCollection.findOne(query);
         if (existingUser){
          return  res.send ({messeage:'user exits', insertedId:null})
         }
         const result = await userCollection.insertOne(user);
         res.send(result);
      })

    
   



    // get user from db for admin page
    app.get('/users', verifyToken, verifyAdmin, async(req,res)=>{
      console.log(req.headers);
      const result = await userCollection.find().toArray();
      res.send(result)
    })

    // delete user apis_____________
     app.delete('/users/:id',verifyToken,verifyAdmin, async(req,res)=>{
      const id = req.params.id;
      const query ={_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query);
      res.send(result);
     })
    //  make admin api__________________
    app.patch('/users/admin/:id',verifyToken,verifyAdmin, async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set:{
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter,updateDoc);
      res.send(result)
    })

    // apii only for admin use
      app.get('/users/admin/:email', verifyToken,  async(req,res)=>{
        const email = req.params.email;
        if(email !== req.decoded.email){
          return res.status(401).send({message: 'unauthorized access'})
        }
        const query ={email: email};
        const user = await userCollection.findOne(query)
        let admin = false;
        if(user){
          admin = user?.role==='admin'
        }
        res.send({admin})

      })

    // jwt apiii(create jwt api)
    app.post('/jwt', (req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_SECRET, {
        expiresIn: '1hr'
      })
      res.send({token});
    })


    // PAYMENT RELATED APIII________
    app.post('/create-payment-intent', async(req,res)=>{
      const {price} =req.body;
      const amount = parseInt(price * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

    // save payment info to the database
    app.post('/payment', async(req,res)=>{
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);
      // console.log('payment data = ', payment);
      
      // carefully delete each item to the card
    //  const query = {_id: {
    //   $in: payment. menuItemId.map( id =>new ObjectId(id))
    //  }}

    const query = { menuId: { $in: payment.menuItemId } };
     const deleteResult = await cartCollection.deleteMany(query)
      res.send({paymentResult,deleteResult})
    })
  
    // paymeny history
    app.get('/payment/:email', verifyToken, async(req,res)=>{
      const query ={email: req.params.email}
      if(req.params.email !== req.decoded.email){
        return res.status(401).send({message:'forbidden access'})
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    })

    // stat/analytics(SHOW HOW MANY ORDER PLACED & TOTAL PAYMENT BY USERS, TOTAL USERS)

    app.get('/admin-stats', async(req,res)=>{
      const user = await userCollection.estimatedDocumentCount();
      const menuItem = await menuCollection.estimatedDocumentCount();
      const orders = await paymentCollection.estimatedDocumentCount();
      // calculate revenue
      // const payments = await paymentCollection.find().toArray();
      // const revenue = payments.reduce((total,payment)=>total+payment.price,0)

      // BETTER WAY TO REVENUE
      const result = await paymentCollection.aggregate([
        {
          $group:{
            _id: null,
             totalRevenue:{
              $sum: '$price'
             }
          }
        }
      ]).toArray();

      const revenue= result.length>0 ? result[0].totalRevenue : 0;

      res.send({
        user,
        menuItem,
        orders,
        revenue
        
      })
    })

    // order stat (show chart of product selling rate & highest sell product, link up between two collection)
    app.get('/order-stat',  async(req,res)=>{
      const result = await paymentCollection.aggregate([
         
          {
            $lookup:{
              from:'menu',
              localField:'menuItemId',
              foreignField:'_id',
              as:'menuItems'
            }
          },
          {
            $unwind:'$menuItems'
          },
          {
            $group:{
              _id: '$menuItems.category',
               quantity:{$sum:1},
               revenue:{$sum: '$menuItems.price'}
            }
          },
          // this pipeline for key name change 
          {
            $project:{
              _id:0,
              category: '$_id',
              quantity:'$quantity',
              revenue:"$revenue"
            }
          }
      ]).toArray();
      res.send(result)
    })

  

     // Send a ping to confirm a successful connection
     await client.db("admin").command({ ping: 1 });
     console.log("Pinged your deployment. You successfully connected to MongoDB!");
   } finally {
     // Ensures that the client will close when you finish/error
   //   await client.close();
   }
 }
 run().catch(console.dir);
 


 app.get('/', (req,res)=>{
    res.send('restaurent server is running')
 })

 app.listen(port,   () =>{
    console.log(`website running on port:${port}`);
 })