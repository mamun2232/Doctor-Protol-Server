const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');

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
      console.log(token);
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

            // read to mongodb 

            app.get('/service', async (req, res) => {
                  const query = {}
                  const cursor = serviceCollection.find(query)
                  const service = await cursor.toArray()
                  res.send(service)
            })


            //----------- booking caletion 
            // booking korar fole eki bokking bar bar korte partesi eti solve jonno 
            app.post('/booking', async (req, res) => {


                  // step 1 check booking jeta add hoise
                  const booking = req.body
                  console.log(booking);
                  const query = {
                        treatment: booking.treatment, date: booking.date, patient: booking.patient
                  }
                  console.log(query);
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


            // create user and add to dataBase 
            app.put('/user/:email', async (req, res) => {
                  const email = req.params.email
                  console.log(email);
                  const user = req.body
                  const filter = { email: email }
                  const options = { upsert: true };
                  const updateDoc = {
                        $set: user

                  };
                  // create jwt token 
                  const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
                  console.log(token);

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
                  }

                  // admin hole sob user ke dekabo tar jonno ja korte hobe 
                  app.get('/admin/:email', verifayJwt , async (req, res) =>{
                        const email = req.params.email
                        // ebar role cheack korbo 
                        const user = await usersCollection.findOne({email: email})

                        const isAdmin = user.role === 'admin'
                        res.send({admin : isAdmin})


                        
                  })




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