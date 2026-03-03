const express = require('express');
const router = express.Router();
const Election = require('../models/election');
const Candidate = require('../models/candidate');
const User = require('../models/user');
const AuditLog = require('../models/auditLog');
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

        // Audit log
        const admin = await User.findById(req.user.id);
        await AuditLog.create({
            action: 'election_created',
            adminId: req.user.id,
            adminName: admin?.name || 'Admin',
            targetType: 'election',
            targetId: saved._id,
            targetName: saved.title,
            details: `Created election "${saved.title}"`,
        });

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

        // Audit log
        const admin = await User.findById(req.user.id);
        const hasStatusChange = req.body.status !== undefined;
        await AuditLog.create({
            action: hasStatusChange ? 'election_status_changed' : 'election_updated',
            adminId: req.user.id,
            adminName: admin?.name || 'Admin',
            targetType: 'election',
            targetId: updated._id,
            targetName: updated.title,
            details: hasStatusChange
                ? `Changed election "${updated.title}" status to ${updated.status}`
                : `Updated election "${updated.title}"`,
        });

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

        // Audit log
        const admin = await User.findById(req.user.id);
        await AuditLog.create({
            action: 'election_deleted',
            adminId: req.user.id,
            adminName: admin?.name || 'Admin',
            targetType: 'election',
            targetId: req.params.id,
            targetName: election.title,
            details: `Deleted election "${election.title}" and all its candidates`,
        });

        res.status(200).json({ message: 'election and its candidates deleted successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET — Detailed stats for an election (total voters, participation, vote timeline)
router.get('/:id/stats', async (req, res) => {
    try {
        const election = await Election.findById(req.params.id);
        if (!election) return res.status(404).json({ message: 'election not found' });

        // All candidates for this election
        const candidates = await Candidate.find({ election: req.params.id });

        // Total registered voters (verified, non-admin)
        const totalRegisteredVoters = await User.countDocuments({ role: 'voter', isVerified: true });

        // Total votes cast in this election
        const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

        // Participation rate
        const participationRate = totalRegisteredVoters > 0
            ? ((totalVotes / totalRegisteredVoters) * 100).toFixed(1)
            : '0.0';

        // Per-candidate breakdown
        const candidateStats = candidates
            .sort((a, b) => b.voteCount - a.voteCount)
            .map(c => ({
                _id: c._id,
                name: c.name,
                party: c.party,
                voteCount: c.voteCount,
                votePercent: totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : '0.0',
            }));

        // Vote timeline — bucket votes by hour using votedAt timestamps
        const allVotes = candidates.flatMap(c => c.votes.map(v => ({ votedAt: v.votedAt })));
        allVotes.sort((a, b) => new Date(a.votedAt) - new Date(b.votedAt));

        // Group by hour bucket
        const timelineMap = {};
        allVotes.forEach(v => {
            const d = new Date(v.votedAt);
            // Round down to hour
            d.setMinutes(0, 0, 0);
            const key = d.toISOString();
            timelineMap[key] = (timelineMap[key] || 0) + 1;
        });
        const voteTimeline = Object.entries(timelineMap).map(([time, count]) => ({ time, count }));

        res.status(200).json({
            election,
            totalRegisteredVoters,
            totalVotes,
            participationRate: parseFloat(participationRate),
            candidateStats,
            voteTimeline,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET — Voter turnout for an election (admin only)
router.get('/:id/turnout', jwtAuthMiddleware, async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'admin only' });
    }

    try {
        const election = await Election.findById(req.params.id);
        if (!election) return res.status(404).json({ message: 'election not found' });

        // All registered voters
        const voters = await User.find({ role: 'voter', isVerified: true })
            .select('name email aadharCardNumber votedElections');

        const totalRegisteredVoters = voters.length;
        const votedVoters = voters.filter(u =>
            u.votedElections.some(e => e.toString() === req.params.id)
        );
        const notVotedVoters = voters.filter(u =>
            !u.votedElections.some(e => e.toString() === req.params.id)
        );

        res.status(200).json({
            election,
            totalRegisteredVoters,
            votedCount: votedVoters.length,
            notVotedCount: notVotedVoters.length,
            participationRate: totalRegisteredVoters > 0
                ? parseFloat(((votedVoters.length / totalRegisteredVoters) * 100).toFixed(1))
                : 0,
            voters: voters.map(u => ({
                _id: u._id,
                name: u.name,
                email: u.email,
                hasVoted: u.votedElections.some(e => e.toString() === req.params.id),
            })),
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

module.exports = router;
