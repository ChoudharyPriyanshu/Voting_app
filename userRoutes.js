const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const {jwtAuthMiddleware,generateToken} = require('./../jwt');

//signup for user
router.post('/signup',async (req,res)=>{

    try{
    const data = req.body //assuming the request body contains user data
    const existingAdmin = await User.findOne({ role: 'admin' });
    
     if(data.role == 'admin'){
         if (existingAdmin) {
                return res.status(403).json({ message: 'An admin already exists' });
           }
       }
        
     // create the new user document using mongoose model
     const newUser = new User(data); 

     // save the new user to the database
    const savedUser = await newUser.save(); 
    console.log('data saved');
    
    const payload ={
        id: savedUser.id

    }

    console.log(JSON.stringify(payload));
    const Token = generateToken(payload);
    console.log('Token is:',Token);

    res.status(200).json({response:savedUser,token:Token});
    }
    catch(err){
     console.log(err);
     res.status(500).json({error:'internal server error'});
    } 
   })
   
    
   // profile route
router.get('/profile',jwtAuthMiddleware,async (req,res)=>{
    try{
        const userData = req.user;

        const userId = userData.id;
        const user  = await User.findById(userId);
        res.status(200).json({user});
    }
    catch(err){
        console.log(err);
        return res.status(401).json({error: 'internal server error'});
    }
})

   
// to change password

router.put('/profile/password',jwtAuthMiddleware,async (req,res)=>{
    try{
       const userId = req.user.id; // extract the user id from Token
       const {currentPassword,newPassword}= req.body; // extract the current and new passwords from request body

       // find the user by userId
       const user = await User.findById(userId);
    
    
       //if user doesnot exist or password does not match,return err
      if( !(await user.comparePassword(currentPassword))){
        return res.status(401).json({error: 'Invalid aadharCardNumber or Password'});
         }
     
       // update password
       user.password = newPassword;
       await user.save();

       console.log('Password Updated');
       res.status(200).json({message:'password updated'});
    
    }
    
    catch(err){
        console.log(err);
    res.status(500).json({error:'internal server error'});
    }
})


//login route 
router.post('/login',async(req,res)=>{
    try{
        // extract aadharCardNumber and password from user body
        
       const {aadharCardNumber,password}= req.body;

       // find user by aadharCardNumber
       const user = await User.findOne({aadharCardNumber:aadharCardNumber});

       //if user doesnot exist or password does not match,return err
       if(!user || !(await user.comparePassword(password))){
        return res.status(401).json({error: 'Invalid aadharCardNumber or Password'});
       }

       // Generate Token 
       const payload = {
        id: user.id,
       }

       const token = generateToken(payload);

       // return Token 
       res.json({token});
    }

    catch(err){
      console.error(err);
      res.status(500).json({error:'Internal Server error'});
    }
})


module.exports = router;