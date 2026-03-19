const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
    electionId: {
        type: String,
        required: true,
        unique: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

});

const Election = mongoose.model('election', electionSchema);
module.exports = Election;
