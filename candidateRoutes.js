const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Candidate = require('../models/candidate');
const {jwtAuthMiddleware,generateToken} = require('../jwt');

// function to check whether admin or not 
const checkAdminRole = async (userID)=>{
   try{
       const user = await  User.findById(userID);
       return user.role === 'admin'
   }
   catch(err){
    return false;
   }
}
//POST route to add a candidate
router.post('/',jwtAuthMiddleware,async (req,res)=>{
    
    if(! await checkAdminRole(req.user.id)) {
        return res.status(403).json({message: 'user has not admin role'});
    }

    try{
     const data = req.body //assuming the request body contains candidate data

     // create the new candidate document using mongoose model
     const newCandidate = new Candidate(data); 

     // save the new candidate to the database
    const savedCandidate = await newCandidate.save(); 
    console.log('data saved');
    
    const payload ={
        id: savedCandidate.id

    }

    console.log(JSON.stringify(payload));
    const Token = generateToken(payload);
    console.log('Token is:',Token);

   return  res.status(200).json({response:savedCandidate,Token});
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

   
// 

router.put('/:candidateId',jwtAuthMiddleware,async (req,res)=>{
    
    if(! await checkAdminRole(req.user.id)) {
        return res.status(403).json({message: 'user has not admin role'});
    }
    
    try{
        const candidateId = req.params.candidateId;
        const updatedCandidateData = req.body;
        
        const response = await Candidate.findByIdAndUpdate(candidateId,updatedCandidateData,{
            new: true, //Return The Updated Data
            runValidators: true //Run Mongoose Validations 
        });
        
        if(!response){
            return res.status(404).json({error: 'candidate not found'})
        }
        console.log('data updated');
        res.status(200).json(response);
    
        }
        catch(err){
            console.log(err);
        res.status(500).json({error:'internal server error'});
        }
})

//delete
router.delete('/:candidateID',jwtAuthMiddleware,async (req,res)=>{

    if(! await checkAdminRole(req.user.id)){
        return res.sendStatus(403).json({message: 'user has not admin role'});
    }

    try{
        const candidateID = req.params.candidateID;
        const response = await Candidate.findByIdAndDelete(candidateID);
        if(!response){
            return res.status(404).json({error: 'candidate not found'})
        }

        console.log('data deleted');
    res.status(200).json({message:'candidate deleted successfully'});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error:'internal server error'});  
    }
})


// let's start vote
 router.post('/vote/:candidateID',jwtAuthMiddleware,async (req,res)=>{
    // no admin can vote 
    // user can only vote once 
     candidateID = req.params.candidateID
     userID = req.user.id
    try{
        // find the candidate document by specified candidatID
        const candidate= await Candidate.findById(candidateID)
        if(!candidate){
            res.status(404).json({message:"candidate not found"})
        }
        const user = await User.findById(userID)
        console.log(user.role)
        if(!user){
            return res.status(404).json({message:"user  not found"})
        }
        if(user.isVoted){
            return res.status(404).json({message:"you have already voted"})
        }
        if(user.role == 'admin'){
           return  res.status(404).json({message:"admin is not allowed to vote"})
        }

        // update the candidate document to record vote
        candidate.votes.push({user:userID})
        candidate.voteCount++;
        await candidate.save();

        // update the user document 
        user.isVoted = true
        await user.save()

       return  res.status(200).json({message:"vote recorded successfully"})
    }
    catch(err){
        console.log(err);
        res.status(500).json({error:'internal server error'}); 
    }

 })


 // vote count 
 router.get('/vote/count',async (req,res)=>{
    try{
    // find all candidates and sort them by votecount in descending order
    const candidates = await Candidate.find().sort({voteCount:'desc'})

    // map the candidate to return only name and  votecount
    const voteRecord = candidates.map((data)=>{
        return{
            party: data.party,
            count: data.voteCount
        }
    
    });
    
    return res.status(200).json(voteRecord)
    }
    catch(err){
        console.log(err);
        res.status(500).json({error:'internal server error'});    
    }
 })

 // list of candidates 
 router.get('/list',async(req,res)=>{
    try{
        // find all candidates 
        const candidates = await Candidate.find()

        // map the candidate to return only name and party
        const LIST = candidates.map((data)=>{
            return{
                party: data.party,
                name: data.name
            }
        
        });
        return res.status(200).json(LIST)
       
    }
    catch(err){
        console.log(err);
        res.status(500).json({error:'internal server error'});    
    }
 })

module.exports = router;