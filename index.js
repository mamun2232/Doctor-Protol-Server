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
            const patientCollection = client.db("patient").collection("service");
            const bookingsCollection = client.db("patient").collection("booking");

            // read to mongodb 

            app.get('/service', async (req, res) => {
                  const query = {}
                  const cursor = patientCollection.find(query)
                  const service = await cursor.toArray()
                  res.send(service)
            })


            // booking caletion 
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