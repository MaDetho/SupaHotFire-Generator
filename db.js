const config = require('./config/cfg'),
    mongoose = require('mongoose'),
    _ = require('lodash');

//MongoDB Connection
mongoose.connect(config.mongodb.uri, function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to MongoDB');
    }
});

//Template Collection Schema
var templateSchema = mongoose.Schema({
    name: String,
    gifid: String,
    frames: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Frame' }],
    created: {
        type: Date,
        default: Date.now
    }
});

//Message Collection Schema
var frameSchema = mongoose.Schema({
    template: { type: Number, ref: 'Template' },
    filename: String,
    width: Number,
    height: Number,
    top: Number,
    left: Number,
    angle: Number,
    created: {
        type: Date,
        default: Date.now
    }
});

var mongoTemplate = mongoose.model('Template', templateSchema);
var mongoFrame = mongoose.model('Frame', frameSchema);

exports.createNewTemplate = (template, callback) => {
    var newTemplate = new mongoTemplate({
        name: template.name,
        gifid: template.gifid,
        frames: []
    });

    _.each(template.frames, (frame) => {
        var newFrame = new mongoFrame({
            filename: frame.filename,
            width: frame.width,
            height: frame.height,
            top: frame.top,
            left: frame.left,
            angle: frame.angle,
            template: newTemplate
        });
        newFrame.save(function (err, frame) {
            if (err) return handleError(err);
        });
        newTemplate.frames.push(newFrame);
    });

    //Save Template
    newTemplate.save(function (err, template) {
        if (err) return handleError(err);
        callback(true);
    });
}

exports.getAllTemplates = function (callback) {
    mongoTemplate.find().select('name gifid').sort({ 'name': -1 }).exec(function (err, templates) {
        if (err) return handleError(err);
        callback(templates)
    });
}

exports.getPreviewFrame = function (gifid, callback) {
    mongoTemplate.find({'gifid': gifid}).select('frames').populate({
        path:'frames',
        options: {
            limit: 1
        }
        }).exec(function (err, templates) {
        if (err) return handleError(err);
        callback(templates)
    });
}

exports.getTemplate = function (gifid, callback) {
    mongoTemplate.findOne({'gifid': gifid}).sort({ 'name': -1 }).populate('frames').exec(function (err, template) {
        if (err) return handleError(err);
        callback(template)
    });
}


/** 
 * Error Handler
 * @method handleError
 * @param {} error
 * @return
 */
function handleError(error) {
    console.log(error);
}
