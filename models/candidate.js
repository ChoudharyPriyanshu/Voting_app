const mongoose = require('mongoose');
//const bcrypt = require('bcrypt');

// define candidate  schema 
const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    party: {
        type: String,
        required: true
    },
    symbol: {
        type: String, // Path or URL to the symbol image
        required: true
    },
    photo: {
        type: String // Path or URL to the candidate photo
    },
    position: {
        type: String
    },
    description: {
        type: String
    },
    manifesto: {
        type: String,
        required: true
    },
    election: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'election',
        required: true
    },
    votes: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',
                required: true
            },
            votedAt: {
                type: Date,
                default: Date.now()
            },
            receiptHash: {
                type: String,
                default: null
            }
        }
    ],
    voteCount: {
        type: Number,
        default: 0
    }
})

// create candidate model
const candidate = mongoose.model('candidate', candidateSchema);
module.exports = candidate;