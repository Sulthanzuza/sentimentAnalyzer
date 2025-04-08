const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const instagramRoutes = require('./routes/routes');


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get('/',(req,res)=>{
  res.send("api running")
})

app.use('/insta', instagramRoutes);


let PORT =process.env.PORT 
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
