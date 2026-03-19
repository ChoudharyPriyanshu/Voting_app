const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
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

// GET — Export election results as CSV (admin only)
router.get('/:id/export/csv', jwtAuthMiddleware, async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'admin only' });
    }

    try {
        const election = await Election.findById(req.params.id);
        if (!election) return res.status(404).json({ message: 'election not found' });

        const candidates = await Candidate.find({ election: req.params.id })
            .sort({ voteCount: -1 });

        const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
        const totalRegisteredVoters = await User.countDocuments({ role: 'voter', isVerified: true });
        const participationRate = totalRegisteredVoters > 0
            ? ((totalVotes / totalRegisteredVoters) * 100).toFixed(1)
            : '0.0';

        // Build CSV
        const rows = [
            ['Election Results — ' + election.title],
            ['Date Exported', new Date().toLocaleString()],
            ['Total Registered Voters', totalRegisteredVoters],
            ['Total Votes Cast', totalVotes],
            ['Participation Rate', participationRate + '%'],
            [],
            ['Rank', 'Candidate Name', 'Party', 'Vote Count', 'Vote %'],
            ...candidates.map((c, i) => [
                i + 1,
                c.name,
                c.party,
                c.voteCount,
                totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) + '%' : '0.0%',
            ]),
        ];

        const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');

        const filename = `election-results-${election.title.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'internal server error' });
    }
});

// GET — Export election results as PDF (admin only)
router.get('/:id/export/pdf', jwtAuthMiddleware, async (req, res) => {
    if (!await checkAdminRole(req.user.id)) {
        return res.status(403).json({ message: 'admin only' });
    }

    try {
        const election = await Election.findById(req.params.id);
        if (!election) return res.status(404).json({ message: 'election not found' });

        const candidates = await Candidate.find({ election: req.params.id })
            .sort({ voteCount: -1 });

        const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);
        const totalRegisteredVoters = await User.countDocuments({ role: 'voter', isVerified: true });
        const participationRate = totalRegisteredVoters > 0
            ? ((totalVotes / totalRegisteredVoters) * 100).toFixed(1)
            : '0.0';

        const filename = `election-results-${election.title.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(res);

        // ── Header ──
        doc.fontSize(22).fillColor('#6366f1').text('VoteApp', { align: 'center' });
        doc.fontSize(16).fillColor('#1e1b4b').text('Election Results Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(18).fillColor('#111827').text(election.title, { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#6b7280').text(`Exported on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(1);

        // ── Divider ──
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
        doc.moveDown(1);

        // ── Summary Stats ──
        doc.fontSize(13).fillColor('#374151').text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#111827');
        doc.text(`Total Registered Voters:   ${totalRegisteredVoters}`);
        doc.text(`Total Votes Cast:           ${totalVotes}`);
        doc.text(`Participation Rate:         ${participationRate}%`);
        if (election.startDate) doc.text(`Start Date:                ${new Date(election.startDate).toLocaleString()}`);
        if (election.endDate) doc.text(`End Date:                  ${new Date(election.endDate).toLocaleString()}`);
        doc.text(`Status:                    ${election.status}`);
        doc.moveDown(1);

        // ── Divider ──
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').lineWidth(1).stroke();
        doc.moveDown(1);

        // ── Results Table ──
        doc.fontSize(13).fillColor('#374151').text('Candidate Results', { underline: true });
        doc.moveDown(0.7);

        // Table header
        const colWidths = [40, 160, 150, 80, 80];
        const colX = [50, 90, 250, 400, 480];
        const rowH = 24;

        // Header row background
        doc.rect(50, doc.y, 495, rowH).fill('#6366f1');
        const headerY = doc.y + 7;
        doc.fillColor('#ffffff').fontSize(10);
        doc.text('Rank', colX[0], headerY, { width: colWidths[0] });
        doc.text('Candidate', colX[1], headerY, { width: colWidths[1] });
        doc.text('Party', colX[2], headerY, { width: colWidths[2] });
        doc.text('Votes', colX[3], headerY, { width: colWidths[3] });
        doc.text('%', colX[4], headerY, { width: colWidths[4] });
        doc.moveDown(0);
        doc.y = headerY + rowH - 7;
        doc.moveDown(0.3);

        // Data rows
        candidates.forEach((c, i) => {
            const pct = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : '0.0';
            const rowY = doc.y;
            const bgColor = i % 2 === 0 ? '#f9fafb' : '#ffffff';
            doc.rect(50, rowY, 495, rowH).fill(bgColor);

            const textY = rowY + 7;
            doc.fillColor('#111827').fontSize(10);
            if (i === 0 && c.voteCount > 0) doc.fillColor('#6366f1'); // Winner highlight
            doc.text(String(i + 1), colX[0], textY, { width: colWidths[0] });
            doc.fillColor('#111827');
            doc.text(c.name, colX[1], textY, { width: colWidths[1] });
            doc.text(c.party, colX[2], textY, { width: colWidths[2] });
            doc.text(String(c.voteCount), colX[3], textY, { width: colWidths[3] });
            doc.text(pct + '%', colX[4], textY, { width: colWidths[4] });
            doc.y = textY + rowH - 7;
            doc.moveDown(0.3);
        });

        // ── Footer ──
        doc.moveDown(2);
        doc.fontSize(9).fillColor('#9ca3af').text('Generated by VoteApp • Confidential', { align: 'center' });

        doc.end();
    } catch (err) {
        console.log(err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'internal server error' });
        }
    }
});

module.exports = router;
