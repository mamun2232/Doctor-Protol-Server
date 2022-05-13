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


async function run(){
      try{
            await client.connect();
            const patientCollection = client.db("patient").collection("service");

            // read to mongodb 

            app.get('/service' , async (req , res) =>{
                  const query = {}
                  const cursor = patientCollection.find(query)
                  const service = await cursor.toArray()
                  res.send(service)
            })

      }

      finally{

      }

}

run().catch(console.dir)
















app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`start dector protol ${port}`)
})