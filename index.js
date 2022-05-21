const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');

// payment 
// step 6  : requre to stripe and show secrte key
const stripe = require('stripe')('sk_test_51L1nmNCGpaTt0RU81oq26j6Ta7gwb9pGlOOwxjeXAQgefsXMvmRxFUopKE2St6GDbDpxjUug0KxRyqzL6oKarPcR00lqLjh70r');

// middale ware 
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://myAdmin:GnbWOPxkDrjF7ohN@admin.lzlwc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



// varifay jwt token 
function verifayJwt(req, res, next) {
      const authHeader = req.headers.authorization
      if (!authHeader) {
            return res.status(401).send({ massage: 'Unauthorization Access' })
      }
      const token = authHeader.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
            if (err) {
                  return res.status(403).send({ massage: 'Forbidden Access' })

            }
            req.decoded = decoded
            next()
      });

}


async function run() {
      try {
            await client.connect();
            const serviceCollection = client.db("patient").collection("service");
            const bookingsCollection = client.db("patient").collection("booking");
            const usersCollection = client.db("patient").collection("user");
            const doctorCollection = client.db("patient").collection("doctor");
            const paymentCollection = client.db("patient").collection("payment");


            // verifay addmin 

            const verifayAdmin = async (req , res , next)=>{
                  const requester = req.decoded.email
                  // chack korbo email ta ache kinaa 
                  const requesterAccount = await usersCollection.findOne({ email: requester })
                  // ebar role ta chack korbo 
                  if (requesterAccount.role === 'admin'){
                        next()
                  }
                  else {
                        return res.status(403).send({ massage: 'Forbidden Access' })
                  }
                  

            }

            // read to mongodb 

            app.get('/service', async (req, res) => {
                  const query = {}
                  const cursor = serviceCollection.find(query).project({name : 1})
                  const service = await cursor.toArray()
                  res.send(service)
            })

            


            //----------- booking caletion 
            // booking korar fole eki bokking bar bar korte partesi eti solve jonno 
            app.post('/booking', async (req, res) => {
                  // step 1 check booking jeta add hoise
                  const booking = req.body
                  const query = {
                        treatment: booking.treatment, date: booking.date, patient: booking.patient
                  }
                  // step 2- find query
                  const exists = await bookingsCollection.findOne(query)
                  // step 3 - chack candition 
                  if (exists) {
                        return res.send({ success: false, booking: exists })
                  }
                  const result = await bookingsCollection.insertOne(booking)
                  return res.send({ success: true, result })
            })


            // je slot gula booking hoise segula jevabe soriye felbo 
            app.get('/available', async (req, res) => {
                  const date = req.query.date;

                  // step 1:  get all services
                  const services = await serviceCollection.find().toArray();

                  // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}, {}]
                  const query = { date: date };
                  const bookings = await bookingsCollection.find(query).toArray();

                  // step 3: for each service
                  services.forEach(service => {
                        // step 4: find bookings for that service. output: [{}, {}, {}, {}]
                        const serviceBookings = bookings.filter(book => book.treatment === service.name);
                        // step 5: select slots for the service Bookings: ['', '', '', '']
                        const bookedSlots = serviceBookings.map(book => book.slot);
                        // step 6: select those slots that are not in bookedSlots
                        const available = service.slots.filter(slot => !bookedSlots.includes(slot));
                        //step 7: set available to slots to make it easier 
                        service.slots = available;
                  });
                  res.send(services);
            })



            // booking caletion to read my booking service 
            app.get('/myBooking', verifayJwt, async (req, res) => {
                  const patient = req.query.patient
                  const query = { patient: patient }

                  // token valid chack 
                  const decodedEmail = req.decoded.email
                  if (patient === decodedEmail) {
                        const booking = await bookingsCollection.find(query).toArray()
                        res.send(booking)
                  }
                  else {
                        return res.status(403).send({ massage: 'Forbidden Access' })
                  }

            })
            // raed specipi service 
            app.get('/booking/:id' , verifayJwt , async(req , res) =>{
                  const id = req.params.id
                  const query = {_id: ObjectId(id)}
                  const result = await bookingsCollection.findOne(query)
                  res.send(result)
            })

            // step : 11- payment hoye gele bokking calection update korbo(payment) 
            app.patch('/booking/:id' , verifayJwt, async (req , res)=>{
                  const id = req.params.id
                  const payment = req.body
                  const filter = {_id: ObjectId(id)}
                  const updateDoc = {
                        $set: {
                              paid: true,
                              transactionId: payment.transactionId
                        }
                  }
                  const result = await bookingsCollection.updateOne(filter , updateDoc)
                  // etike payment collection rakbo 
                  const setPayment = await paymentCollection.insertOne(payment)
                  res.send(updateDoc)
            })

                  //---------------------- crete admin -----------------------
            // create user and add to dataBase 
            app.put('/user/:email', async (req, res) => {
                  const email = req.params.email
                  const user = req.body
                  const filter = { email: email }
                  const options = { upsert: true };
                  const updateDoc = {
                        $set: user

                  };
                  // create jwt token 
                  const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
                  const result = await usersCollection.updateOne(filter, updateDoc, options)
                  res.send({ result, token })
            })

            // Load user to database 
            app.get('/user', verifayJwt, async (req, res) => {
                  const query = {}
                  const user = await usersCollection.find(query).toArray()
                  res.send(user)
            })


            // Make a Admin and add to dataBase
            // note: ekhane jest userCaletion e role name Admin add kore decci 
            app.put('/user/admin/:email', verifayJwt, async (req, res) => {
                  const email = req.params.email

                  // jekuno user admin baniye feltse eti thekanor jonno 
                  const requester = req.decoded.email
                  // chack korbo email ta ache kinaa 
                  const requesterAccount = await usersCollection.findOne({ email: requester })
                  // ebar role ta chack korbo 
                  if (requesterAccount.role === 'admin') {
                        const filter = { email: email }
                        const updateDoc = {
                              $set: { role: 'admin' }

                        };
                        const result = await usersCollection.updateOne(filter, updateDoc)
                        res.send(result)

                  }
                  else{
                        res.status(403).send({message : 'Forbidden Access'})
                  } })

               // admin hole sob user ke dekabo tar jonno ja korte hobe 
            app.get('/admin/:email', verifayJwt , async (req , res) =>{
                  const email = req.params.email
               
                  // ebar role cheack korbo 
                  const user = await usersCollection.findOne({email: email})
                  const isAdmin = user.role === 'admin'
                  res.send({admin : isAdmin})
                  
            })



            // add a doctor 
            app.post('/doctor' , verifayJwt, verifayAdmin , async (req , res)=>{
                  const addedDoctor = req.body
                  const doctor = await doctorCollection.insertOne(addedDoctor)
                  res.send({success: "Doctor Added SuccessFull"})
            })

            // read doctor 
            app.get('/doctor' , verifayJwt , verifayAdmin , async (req , res) =>{
                  const query = {}
                  const doctor = await doctorCollection.find(query).toArray()
                  res.send(doctor)
            })

            app.delete('/doctor/:email' ,verifayJwt, verifayAdmin, async (req , res) =>{
                  const email = req.params.email
                  const filter = {email: email}
                  const result = await doctorCollection.deleteOne(filter)
                  res.send(result)


      })

      // payment method aplement 
      app.post('/create-checkout-session', verifayJwt , async (req , res) =>{
            const service = req.body
            const price = service.price
            // tk to conbrate to poisha 
            const amount = price*100

            // step -7: create paymentIntent and sekhane bole debo koto tk katbe 
            const paymentIntent = await stripe.paymentIntents.create({
                  amount: amount,
                  currency: "usd",
                  payment_method_types: ['card']
                });
                res.send({clientSecret: paymentIntent.client_secret})

      })
   





      }

      finally {

      }

}

run().catch(console.dir)




app.get('/', (req, res) => {
      res.send('Hello World!')
})

app.listen(port, () => {
      console.log(`start dector protol ${port}`)
})