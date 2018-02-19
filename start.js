const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const gm = require('gm').subClass({ imageMagick: true });
let _ = require('lodash');
let req = require('request');
let fs = require('fs');
let supaJson = require('./test.json');
let imWorking = false;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.post('/supa', function (request, response, next) {
	let supaHot = {};
	supaHot.message = "<img src='http://www.reactiongifs.com/r/2013/06/supa-hot-fire.gif' />";
	supaHot.message_format = 'html'
	response.send(supaHot);
});

app.get('/png', function (request, response, next) {
	gm('supa.gif').coalesce().write('./imgs/loop_%03d.gif', function (err) {
		if (err) console.log(err);
	});
});

app.post('/face', function (request, response, next) {
	response.setHeader('Content-Type', 'application/json');
	let faceUrl = request.body.faceurl;
	let resizedFactor = request.body.resize;

	//Check required Params
	if(!faceUrl || !resizedFactor) {
		response.status(400).send({"message":"Missing body params..."});
		return;
	}

	//Check if im Working...
	if(imWorking) {
		response.status(503).send({"message":"Worker is doing shit, try again later..."});
		return;
	}
	
	imWorking = true;
	let currentMillis = (new Date).getTime();
	let filename = 'faces/' + currentMillis + '.' + faceUrl.split('.').pop();
	req.get(faceUrl)
		.on('error', function (err) {
			imWorking = false;
			console.log(err)
		}).pipe(fs.createWriteStream(filename)
			.on('finish', function () {
				buildFrames(filename, currentMillis, supaJson, resizedFactor, request.body.caption, function (gifFilename) {
					imWorking = false;
					response.status(200).send({"filename": gifFilename});
					return;
				});
			}));
});

let buildFrames = function (faceFilename, currentMillis, jsonFrames, resizePercentage, caption, callback) {
	let count = 0;
	let zeros = '000';
	let framesCount = Object.keys(jsonFrames.frames).length;
	let frameFinished = _.after(framesCount, function () { return buildLoop(currentMillis, callback) });
	let tempJson = {};
	tempJson.frames = [];
	for (let frame of jsonFrames.frames) {
		let resizedWidth = (frame.width / 100) * resizePercentage + frame.width;
		let resizedHeight = (frame.height / 100) * resizePercentage + frame.height;
		let cordx = frame.cordx - Math.ceil((resizedWidth / 2));
		let cordy = frame.cordy - Math.ceil((resizedHeight / 2));
		count++;
		if (count < 10) {
			zeros = '00';
		} else {
			zeros = '0'
		}
		let cordinates = cordx + ',' + cordy + ' ' + resizedWidth + ',' + resizedHeight;
		let fontSizeTwoLines = 20;
		let faceImage = gm('imgs/' + frame.img).draw(['image Over ' + cordinates + ' ' + faceFilename]);
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

let buildLoop = function (currentMillis, callback) {
	let gifFilename = currentMillis + '.gif';
	gm('edit/*.gif').delay(4).loop('0').write('./public/' + currentMillis + '.gif', function (err) {
		if (err) console.log(err);
		callback(gifFilename);
	});
}

let stringDivider = function (str, width, spaceReplacer) {
	if (str.length > width) {
		let p = width
		for (; p > 0 && str[p] != ' '; p--) {
		}
		if (p > 0) {
			let left = str.substring(0, p);
			let right = str.substring(p + 1);
			return left + spaceReplacer + stringDivider(right, width, spaceReplacer);
		}
	}
	return str;
}


app.listen(8085, function () {
	console.log('Supa Hot on port 8085!');
});
