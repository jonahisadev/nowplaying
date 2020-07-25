const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/nowp', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = mongoose.Schema({
    // Account
    email: String,

    // Spotify
    sp_access: String,
    sp_refresh: String,
    sp_expires: Date,

    // Overlay
    o_opacity: Number,
    o_outline: Boolean,
    o_color: String,
    o_hex: String,
});

module.exports = mongoose.model('User', userSchema);