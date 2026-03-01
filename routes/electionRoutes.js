const express = require('express');
const router = express.Router();
const Election = require('../models/election');
const Candidate = require('../models/candidate');
const User = require('../models/user');
const { jwtAuthMiddleware } = require('../jwt');

// Helper: check admin role
const checkAdminRole = async (userID) => {
    try {
        const user = await User.findById(userID);
        return user.role === 'admin';
    } catch {
        return false;
    }
};

// POST — Create a new election (admin only)
router.post('/', jwtAuthMiddleware, async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'user has not admin role' });
    }

    try {
        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'title is required' });
        }

        const newElection = new Election({ title, description });
        const saved = await newElection.save();
        console.log('Election created:', saved.title);
        res.status(200).json(saved);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET — List all elections
router.get('/', async (req, res) => {
    try {
        const elections = await Election.find().sort({ createdAt: -1 });
        res.status(200).json(elections);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET — Get single election with its candidates
router.get('/:id', async (req, res) => {
    try {
        const election = await Election.findById(req.params.id);
        if (!election) {
            return res.status(404).json({ message: 'election not found' });
        }

        const candidates = await Candidate.find({ election: req.params.id })
            .select('name age party voteCount _id');

        res.status(200).json({ election, candidates });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// PUT — Update election (admin only)
router.put('/:id', jwtAuthMiddleware, async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'user has not admin role' });
    }

    try {
        const updated = await Election.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'election not found' });
        }
        console.log('Election updated:', updated.title);
        res.status(200).json(updated);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// DELETE — Delete election and all its candidates (admin only)
router.delete('/:id', jwtAuthMiddleware, async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'user has not admin role' });
    }

    try {
        const election = await Election.findByIdAndDelete(req.params.id);
        if (!election) {
            return res.status(404).json({ message: 'election not found' });
        }

        // Also delete all candidates in this election
        await Candidate.deleteMany({ election: req.params.id });

        console.log('Election deleted:', election.title);
        res.status(200).json({ message: 'election and its candidates deleted successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
