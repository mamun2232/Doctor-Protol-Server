const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');

// middale ware 
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://myAdmin:GnbWOPxkDrjF7ohN@admin.lzlwc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
      try {
            await client.connect();
            const serviceCollection = client.db("patient").collection("service");
            const bookingsCollection = client.db("patient").collection("booking");

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
                  if(exists){
                       return res.send({success: false , booking: exists})
                  }

                  const result = await bookingsCollection.insertOne(booking)
                  return res.send({success: true , result})
            })


            // je slot gula booking hoise segula jevabe soriye felbo 
            app.get('/available', async(req, res) =>{
                  const date = req.query.date;
            
                  // step 1:  get all services
                  const services = await serviceCollection.find().toArray();
            
                  // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}, {}]
                  const query = {date: date};
                  const bookings = await bookingsCollection.find(query).toArray();
            
                  // step 3: for each service
                  services.forEach(service=>{
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
            app.get('/myBooking' , async (req , res) =>{
                  const patient = req.query.patient
                  const query = {patient: patient}
                  const booking = await bookingsCollection.find(query).toArray()
                  res.send(booking)
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