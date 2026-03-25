/**
 * Candidate Routes
 * Handles candidate management (add, update, delete) and voting operations.
 * Base Path: /api/v1/candidate
 */
const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/user');
const Candidate = require('../models/candidate');
const Election = require('../models/election');
const AuditLog = require('../models/auditLog');
const { jwtAuthMiddleware, generateToken } = require('../jwt');
const multer = require('multer');
const path = require('path');

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/candidates');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// function to check whether admin or not 
const checkAdminRole = async (userID) => {
    try {
        const user = await User.findById(userID);
        return user.role === 'admin';
    } catch (err) {
        return false;
    }
};

// Helper: check if results should be locked
const isResultsLocked = (election) => {
    if (election.status === 'completed') return false;
    const now = new Date();
    if (election.endDate && now > new Date(election.endDate)) return false;
    return true;
};

// POST route to add a candidate (must include election field)
router.post('/', jwtAuthMiddleware, upload.fields([{ name: 'symbol', maxCount: 1 }, { name: 'photo', maxCount: 1 }]), async (req, res) => {
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

        // Ownership restriction: Only owner can add candidates
        if (election.adminId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'you do not own this election' });
        }

        // Add file paths to data
        if (req.files) {
            if (req.files.symbol) data.symbol = `/uploads/candidates/${req.files.symbol[0].filename}`;
            if (req.files.photo) data.photo = `/uploads/candidates/${req.files.photo[0].filename}`;
        }

        const newCandidate = new Candidate(data);
        const savedCandidate = await newCandidate.save();
        console.log('candidate saved');

        // Audit log
        const admin = await User.findById(req.user.id);
        await AuditLog.create({
            action: 'candidate_added',
            adminId: req.user.id,
            adminName: admin?.name || 'Admin',
            targetType: 'candidate',
            targetId: savedCandidate._id,
            targetName: savedCandidate.name,
            details: `Added candidate "${savedCandidate.name}" (${savedCandidate.party}) to election`,
        });

        return res.status(200).json({ response: savedCandidate });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Update candidate (admin only)
router.put('/:candidateId', jwtAuthMiddleware, upload.fields([{ name: 'symbol', maxCount: 1 }, { name: 'photo', maxCount: 1 }]), async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'user has not admin role' });
    }

    try {
        const candidateId = req.params.candidateId;
        const updatedCandidateData = req.body;

        const candidate = await Candidate.findById(candidateId).populate('election');
        if (!candidate) {
            return res.status(404).json({ error: 'candidate not found' });
        }

        // Ownership restriction: Only owner of the election can update its candidates
        if (candidate.election.adminId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'you do not own the election this candidate belongs to' });
        }

        // Add file paths to updated data
        if (req.files) {
            if (req.files.symbol) updatedCandidateData.symbol = `/uploads/candidates/${req.files.symbol[0].filename}`;
            if (req.files.photo) updatedCandidateData.photo = `/uploads/candidates/${req.files.photo[0].filename}`;
        }

        const response = await Candidate.findByIdAndUpdate(candidateId, updatedCandidateData, {
            new: true,
            runValidators: true
        });

        if (!response) {
            return res.status(404).json({ error: 'candidate not found' });
        }
        console.log('candidate updated');

        // Audit log
        const admin = await User.findById(req.user.id);
        await AuditLog.create({
            action: 'candidate_updated',
            adminId: req.user.id,
            adminName: admin?.name || 'Admin',
            targetType: 'candidate',
            targetId: response._id,
            targetName: response.name,
            details: `Updated candidate "${response.name}"`,
        });

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
        const candidate = await Candidate.findById(candidateID).populate('election');
        if (!candidate) {
            return res.status(404).json({ error: 'candidate not found' });
        }

        // Ownership restriction: Only owner of the election can delete its candidates
        if (candidate.election.adminId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'you do not own the election this candidate belongs to' });
        }

        const response = await Candidate.findByIdAndDelete(candidateID);
        if (!response) {
            return res.status(404).json({ error: 'candidate not found' });
        }

        console.log('candidate deleted');

        // Audit log
        const admin = await User.findById(req.user.id);
        await AuditLog.create({
            action: 'candidate_deleted',
            adminId: req.user.id,
            adminName: admin?.name || 'Admin',
            targetType: 'candidate',
            targetId: candidateID,
            targetName: response.name,
            details: `Deleted candidate "${response.name}" (${response.party})`,
        });

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

        // Check election timing
        const election = await Election.findById(electionId);
        if (!election) {
            return res.status(404).json({ message: 'election not found' });
        }
        if (election.status === 'completed') {
            return res.status(400).json({ message: 'this election has ended' });
        }
        const now = new Date();
        if (election.startDate && now < new Date(election.startDate)) {
            return res.status(400).json({ message: 'this election has not started yet' });
        }
        if (election.endDate && now > new Date(election.endDate)) {
            return res.status(400).json({ message: 'this election has ended' });
        }

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

        // Generate receipt hash: SHA-256 of (userId + electionId + timestamp + random salt)
        const salt = crypto.randomBytes(16).toString('hex');
        const receiptData = `${userID}-${electionId}-${Date.now()}-${salt}`;
        const receiptHash = crypto.createHash('sha256').update(receiptData).digest('hex');

        // Record vote on candidate with receipt
        candidate.votes.push({ user: userID, receiptHash });
        candidate.voteCount++;
        await candidate.save();

        // Mark election as voted for this user
        user.votedElections.push(electionId);
        await user.save();

        return res.status(200).json({
            message: 'vote recorded successfully',
            receiptHash,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Vote count for a specific election
router.get('/vote/count/:electionId', async (req, res) => {
    try {
        const election = await Election.findById(req.params.electionId);
        if (!election) {
            return res.status(404).json({ message: 'election not found' });
        }

        const resultsLocked = isResultsLocked(election);
        const candidates = await Candidate.find({ election: req.params.electionId })
            .sort({ voteCount: 'desc' });

        const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

        const voteRecord = candidates.map((data) => {
            return {
                party: data.party,
                name: data.name,
                symbol: data.symbol,
                count: resultsLocked ? null : data.voteCount
            };
        });

        return res.status(200).json({ results: voteRecord, totalVotes, resultsLocked });
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
                symbol: data.symbol,
                photo: data.photo,
                position: data.position,
                description: data.description,
                manifesto: data.manifesto
            };
        });
        return res.status(200).json(LIST);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// Verify a vote receipt
router.get('/vote/receipt/:receiptId', async (req, res) => {
    try {
        const { receiptId } = req.params;

        // Search all candidates for a vote with this receipt hash
        const candidate = await Candidate.findOne({ 'votes.receiptHash': receiptId })
            .populate('election', 'title status');

        if (!candidate) {
            return res.status(404).json({ valid: false, message: 'Receipt not found' });
        }

        const vote = candidate.votes.find(v => v.receiptHash === receiptId);

        // Return confirmation WITHOUT revealing who they voted for
        return res.status(200).json({
            valid: true,
            election: candidate.election?.title || 'Unknown',
            electionStatus: candidate.election?.status || 'unknown',
            votedAt: vote?.votedAt,
            message: 'Your vote is verified and recorded.',
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;