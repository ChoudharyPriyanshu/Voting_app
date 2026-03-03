const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'election_created', 'election_updated', 'election_deleted',
            'candidate_added', 'candidate_updated', 'candidate_deleted',
            'election_status_changed',
        ],
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    adminName: {
        type: String,
    },
    targetType: {
        type: String,
        enum: ['election', 'candidate'],
        required: true,
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    targetName: {
        type: String,
    },
    details: {
        type: String,
        default: '',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('auditLog', auditLogSchema);
module.exports = AuditLog;
