const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const gm = require('gm').subClass({ imageMagick: true });
var _ = require('lodash');
var req = require('request');
var fs = require('fs');
var supaJson = require('./test.json');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.post('/supa', function (request, response, next) {
	var supaHot = {};
	supaHot.message = "<img src='http://www.reactiongifs.com/r/2013/06/supa-hot-fire.gif' />";
	supaHot.message_format = 'html'
	response.send(supaHot);
});

app.get('/png', function (request, response, next) {
	console.log('ff');
	gm('supa.gif').coalesce().write('./imgs/loop_%03d.gif', function (err) {
		if (err) console.log(err);
	});
});

app.post('/face', function (request, response, next) {
	var resizedFactor = 0;
	if (request.body.resize) {
		resizedFactor = request.body.resize;
	}
	var currentMillis = (new Date).getTime();
	var filename = 'faces/' + currentMillis + '.' + request.body.faceurl.split('.').pop();
	req.get(request.body.faceurl)
		.on('error', function (err) {
			console.log(err)
		}).pipe(fs.createWriteStream(filename)
			.on('finish', function () {
				buildFrames(filename, currentMillis, supaJson, resizedFactor, request.body.caption, function (gifFilename) {
					response.status(200).send(gifFilename);
				});
			}));
});

var buildFrames = function (faceFilename, currentMillis, jsonFrames, resizePercentage, caption, callback) {
	var count = 0;
	var zeros = '000';
	var framesCount = Object.keys(jsonFrames.frames).length;
	var frameFinished = _.after(framesCount, function () { return buildLoop(currentMillis, callback) });
	var tempJson = {};
	tempJson.frames = [];
	for (var frame of jsonFrames.frames) {
		var resizedWidth = (frame.width / 100) * resizePercentage + frame.width;
		var resizedHeight = (frame.height / 100) * resizePercentage + frame.height;
		var cordx = frame.cordx - Math.ceil((resizedWidth / 2));
		var cordy = frame.cordy - Math.ceil((resizedHeight / 2));
		count++;
		if (count < 10) {
			zeros = '00';
		} else {
			zeros = '0'
		}
		var cordinates = cordx + ',' + cordy + ' ' + resizedWidth + ',' + resizedHeight;
		var fontSizeTwoLines = 20;
		var faceImage = gm('imgs/' + frame.img).draw(['image Over ' + cordinates + ' ' + faceFilename]);
		if (caption) {
			faceImage = faceImage.background('black')
				.fill('white')
				.fontSize(fontSizeTwoLines)
				.gravity('South')
				.extent(0, 315)
				.drawText(0, (caption.length > 24 ? 10 : 25), stringDivider(caption, 24, '\n'), 'North');
		}
		faceImage.write('./edit/supa_' + zeros + '' + count + '.gif', function (err) {
			if (err) console.log(err);
			frameFinished();
		});
	}
}

var buildLoop = function (currentMillis, callback) {
	var gifFilename = currentMillis + '.gif';
	gm('edit/*.gif').delay(4).loop('0').write('./public/' + currentMillis + '.gif', function (err) {
		if (err) console.log(err);
		console.log('done');
		callback(gifFilename);
	});
}

var stringDivider = function (str, width, spaceReplacer) {
	if (str.length > width) {
		var p = width
		for (; p > 0 && str[p] != ' '; p--) {
		}
		if (p > 0) {
			var left = str.substring(0, p);
			var right = str.substring(p + 1);
			return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
		}
	}
	return str;
}


app.listen(8085, function () {
	console.log('Supa Hot on port 8085!');
});
