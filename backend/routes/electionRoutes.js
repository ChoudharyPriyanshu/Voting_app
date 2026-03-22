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

// Helper: check if results should be locked
const isResultsLocked = (election) => {
    if (election.status === 'completed') return false;
    const now = new Date();
    if (election.endDate && now > new Date(election.endDate)) return false;
    return true;
};

// GET — List all verified voters (admin only)
router.get('/voters/list', jwtAuthMiddleware, async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'admin only' });
    }
    try {
        const voters = await User.find({ role: 'voter', isVerified: true })
            .select('name voterId email')
            .sort({ name: 1 });
        res.status(200).json(voters);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// POST — Create a new election (admin only)
router.post('/', jwtAuthMiddleware, async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'user has not admin role' });
    }

    try {
        const { title, description, startDate, endDate } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'title is required' });
        }

        // Auto-generate unique electionId
        let electionId;
        let isUnique = false;
        while (!isUnique) {
            electionId = `ELEC-${Math.floor(100000 + Math.random() * 900000)}`;
            const existing = await Election.findOne({ electionId });
            if (!existing) isUnique = true;
        }

        // Date validation
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate && new Date(startDate) < today) {
            return res.status(400).json({ message: 'Start date must be today or in the future' });
        }

        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({ message: 'End date must be after the start date' });
        }

        const newElection = new Election({ 
            title, 
            description, 
            electionId, 
            adminId: req.user.id,
            startDate,
            endDate,
            eligibleVoters: req.body.eligibleVoters || []
        });

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

// GET — List all elections (filtered by ownership for admins)
router.get('/', jwtAuthMiddleware, async (req, res) => {
    try {
        let filter = {};
        const user = await User.findById(req.user?.id);
        
        // If user is an admin, only show THEIR elections in the dashboard
        if (user && user.role === 'admin') {
            filter.adminId = user._id;
        } else if (user && user.role === 'voter') {
            // If user is a voter, only show elections they are eligible for
            filter.eligibleVoters = user._id;
        }

        const elections = await Election.find(filter).sort({ createdAt: -1 });
        res.status(200).json(elections);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET — Get single election with its candidates
router.get('/:id', jwtAuthMiddleware, async (req, res) => {
    try {
        const election = await Election.findById(req.params.id).populate('eligibleVoters', 'name voterId email');
        if (!election) {
            return res.status(404).json({ message: 'election not found' });
        }

        // Ownership check for admins (optional for viewing, but recommended for data separation)
        const user = await User.findById(req.user?.id);
        if (user && user.role === 'admin' && election.adminId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'you do not own this election' });
        }

        const resultsLocked = isResultsLocked(election);
        const candidates = await Candidate.find({ election: req.params.id })
            .select(resultsLocked ? 'name age party _id' : 'name age party voteCount _id');

        res.status(200).json({ election, candidates, resultsLocked });
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
        const { startDate, endDate } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate && new Date(startDate) < today) {
            return res.status(400).json({ message: 'Start date must be today or in the future' });
        }

        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({ message: 'End date must be after the start date' });
        }

        const election = await Election.findById(req.params.id);
        if (!election) {
            return res.status(404).json({ message: 'election not found' });
        }

        // Restriction: Only owner can update
        if (election.adminId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'you do not own this election' });
        }

        const updated = await Election.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'election not found' });
        }
        
        // Populate if needed for response
        const populated = await Election.findById(updated._id).populate('eligibleVoters', 'name voterId');

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
        const electionToVerify = await Election.findById(req.params.id);
        if (!electionToVerify) {
            return res.status(404).json({ message: 'election not found' });
        }

        // Restriction: Only owner can delete
        if (electionToVerify.adminId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'you do not own this election' });
        }

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

        const resultsLocked = isResultsLocked(election);

        // Per-candidate breakdown
        let candidateStats = [];
        if (!resultsLocked) {
            candidateStats = candidates
                .sort((a, b) => b.voteCount - a.voteCount)
                .map(c => ({
                    _id: c._id,
                    name: c.name,
                    party: c.party,
                    voteCount: c.voteCount,
                    votePercent: totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : '0.0',
                }));
        }

        // Vote timeline — bucket votes by hour using votedAt timestamps
        let voteTimeline = [];
        if (!resultsLocked) {
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
            voteTimeline = Object.entries(timelineMap).map(([time, count]) => ({ time, count }));
        }

        res.status(200).json({
            election,
            totalRegisteredVoters,
            totalVotes,
            participationRate: parseFloat(participationRate),
            candidateStats,
            voteTimeline,
            resultsLocked,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET — Voter turnout for an election (admin only)
router.get('/:id/turnout', jwtAuthMiddleware, async (req, res) => {
    try {
        const election = await Election.findById(req.params.id);
        if (!election) return res.status(404).json({ message: 'election not found' });

        // Restriction: Only owner can view turnout
        if (election.adminId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'you do not own this election' });
        }

        if (!await checkAdminRole(req.user.id)) {
            return res.status(403).json({ message: 'admin only' });
        }

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
