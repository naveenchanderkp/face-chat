const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const Userdata = require('./model/model')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const SECRET_KEY = 'secret_key'
const nodemailer = require('nodemailer')


const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors({ origin: 'http://localhost:3001', credentials: true }));

app.use(express.json())

mongoose.connect('mongodb://127.0.0.1:27017/AS-login')

///Register:
app.post('/register',async (req,res)=>{

    try {
        const { name, email, password } = req.body
        const hashedPassword = await bcrypt.hash(password,10)
        const newUser = new Userdata({ name, email, password:hashedPassword })
        await newUser.save()
        res.status(201).json({ message:'Registered successfully'})
    } catch (error) {
        res.status(500).json({ message:"error signing up" })

    }
    
})

//GET req

app.get('/register',async (req,res)=>{
    try{
    const users = await Userdata.find()
    res.status(201).json(users)
    }
    catch(err){
        res.status(400).json({ message:'error to get users' })
    }
})

///Login:
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await Userdata.findOne({ email })
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials'})
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if(!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }
        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1hr' })
        res.json({ message: 'Login successful',token })
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' })
    }
})

/// reset password

app.post('/forgotpassword',async(req,res)=>{
    const {email} = req.body;
    try {
        const user = await Userdata.findOne({email})
        if(!user){
            return res.json({message:"user not exist!!"})
        }
       
        const token = jwt.sign({id: user._id},SECRET_KEY)
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'naveenjo98@gmail.com',
    pass: 'fmxx vhec gsik dyvf'
  }
});

var mailOptions = {
  from: 'naveenjo98@gmail.com',
  to: email,
  subject: 'Reset password',
  text: `http://localhost:3001/forgetpassword/${token}`
};

transporter.sendMail(mailOptions, function(error){
  if (error) {
    console.log(error, "error sending email");
  } else {
    console.log('Email sent: ');
  }
});
        
    } catch (error) {
        
    }
})
///change password
app.post('/forgetpassword/:token',async (req,res)=>{
    const {token} = req.params
    const {password} = req.body

    try {
        const decoded = await jwt.verify(token, SECRET_KEY)
        const id = decoded.id;
        const hashPassword = await bcrypt.hash(password,10)
        await Userdata.findByIdAndUpdate({_id:id},{password:hashPassword})
        return res.json({staus:'ok',message:'Updated succesfully'})
    } catch (error) {
        return res.json({message:'invalid token'})
    }

})
////logout
app.post('/logout',(req,res)=>{
    req.clearCookie('token')
    return res.json({status:true})
})

////video call 

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
  
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      socket.to(roomId).broadcast.emit('user-connected', socket.id);
  
      socket.on('disconnect', () => {
        socket.to(roomId).broadcast.emit('user-disconnected', socket.id);
      });
    });
  
    socket.on('send-message', (roomId, message) => {
      socket.to(roomId).broadcast.emit('receive-message', {
        id: socket.id,
        message,
      });
    });
  });
  


app.listen(3000,()=>{
    console.log("i am listening")
})
