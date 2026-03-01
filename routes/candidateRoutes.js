const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Candidate = require('../models/candidate');
const Election = require('../models/election');
const { jwtAuthMiddleware, generateToken } = require('../jwt');

// function to check whether admin or not 
const checkAdminRole = async (userID) => {
    try {
        const user = await User.findById(userID);
        return user.role === 'admin';
    } catch (err) {
        return false;
    }
};

// POST route to add a candidate (must include election field)
router.post('/', jwtAuthMiddleware, async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'user has not admin role' });
    }

    try {
        const data = req.body;

        // Verify election exists
        if (!data.election) {
            return res.status(400).json({ message: 'election field is required' });
        }
        const election = await Election.findById(data.election);
        if (!election) {
            return res.status(404).json({ message: 'election not found' });
        }

        const newCandidate = new Candidate(data);
        const savedCandidate = await newCandidate.save();
        console.log('candidate saved');

        return res.status(200).json({ response: savedCandidate });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Update candidate (admin only)
router.put('/:candidateId', jwtAuthMiddleware, async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'user has not admin role' });
    }

    try {
        const candidateId = req.params.candidateId;
        const updatedCandidateData = req.body;

        const response = await Candidate.findByIdAndUpdate(candidateId, updatedCandidateData, {
            new: true,
            runValidators: true
        });

        if (!response) {
            return res.status(404).json({ error: 'candidate not found' });
        }
        console.log('candidate updated');
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Delete candidate (admin only)
router.delete('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'user has not admin role' });
    }

    try {
        const candidateID = req.params.candidateID;
        const response = await Candidate.findByIdAndDelete(candidateID);
        if (!response) {
            return res.status(404).json({ error: 'candidate not found' });
        }

        console.log('candidate deleted');
        res.status(200).json({ message: 'candidate deleted successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Vote for a candidate (scoped to election)
router.post('/vote/:candidateID', jwtAuthMiddleware, async (req, res) => {
    const candidateID = req.params.candidateID;
    const userID = req.user.id;

    try {
        const candidate = await Candidate.findById(candidateID);
        if (!candidate) {
            return res.status(404).json({ message: 'candidate not found' });
        }

        const electionId = candidate.election;

        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ message: 'user not found' });
        }
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'admin is not allowed to vote' });
        }

        // Check if user already voted in THIS election
        if (user.votedElections && user.votedElections.some(e => e.toString() === electionId.toString())) {
            return res.status(400).json({ message: 'you have already voted in this election' });
        }

        // Record vote on candidate
        candidate.votes.push({ user: userID });
        candidate.voteCount++;
        await candidate.save();

        // Mark election as voted for this user
        user.votedElections.push(electionId);
        await user.save();

        return res.status(200).json({ message: 'vote recorded successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Vote count for a specific election
router.get('/vote/count/:electionId', async (req, res) => {
    try {
        const candidates = await Candidate.find({ election: req.params.electionId })
            .sort({ voteCount: 'desc' });

        const voteRecord = candidates.map((data) => {
            return {
                party: data.party,
                name: data.name,
                count: data.voteCount
            };
        });

        return res.status(200).json(voteRecord);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// List candidates for a specific election
router.get('/list/:electionId', async (req, res) => {
    try {
        const candidates = await Candidate.find({ election: req.params.electionId });

        const LIST = candidates.map((data) => {
            return {
                _id: data._id,
                party: data.party,
                name: data.name,
                age: data.age
            };
        });
        return res.status(200).json(LIST);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;