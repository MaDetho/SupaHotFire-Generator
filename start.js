const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const gm = require('gm');
const exec = require('child_process').exec;
const _ = require('lodash');
const req = require('request');
const fs = require('fs');
const supaJson = require('./test.json');
const validUrl = require('valid-url');
const mongo = require('./db');
const path = require('path');
let imWorking = false;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.post('/split', function (request, response, next) {
	response.setHeader('Content-Type', 'application/json');
	let currentMillis = (new Date()).getTime();
	let templateDir = '/template/' + currentMillis;
	let saveDir = './public' + templateDir;
	fs.mkdirSync(saveDir);
	gm(req(request.body.url)).coalesce().out('+adjoin').write(saveDir + '/' + currentMillis + '_%03d.png', function (err) {
		if (err) console.log(err);
		fs.readdir(saveDir, (err, files) => {
			let reponseJson = {};
			gm(saveDir + '/' + files[0])
				.size(function (err, size) {
					if (!err)
						response.status(200).send({ width: size.width, height: size.height, urlPrefix: templateDir, gifid: currentMillis, files: files });
				});
		});
	});
});

app.post('/new', function (request, response, next) {
	response.setHeader('Content-Type', 'application/json');
	mongo.createNewTemplate(request.body, () => {
		return response.status(200).send({});
	});
});

app.get('/templates', function (request, response, next) {
	response.setHeader('Content-Type', 'application/json');
	mongo.getAllTemplates((templates) => {
		return response.status(200).send(templates);
	});
});

app.get('/templates/:gifid', function (request, response, next) {
	response.setHeader('Content-Type', 'application/json');
	let gifid = request.params.gifid;
	mongo.getPreviewFrame(gifid, (frame) => {
		return response.status(200).send(frame);
	});
});

app.post('/face', function (request, response, next) {
	response.setHeader('Content-Type', 'application/json');
	let faceUrl = request.body.faceurl;
	let resizedFactor = request.body.resize;
	let templateId = request.body.gifid;
	let delayms = request.body.delayms ? request.body.delayms : 4;

	//Check required Params
	if (!faceUrl || !resizedFactor) {
		return response.status(400).send({ "message": "Missing body params..." });
	}

	if (!validUrl.isUri(faceUrl)) {
		return response.status(501).send({ "message": "Invalid face uri" });
	}

	//Check if im Working...
	if (imWorking) {
		response.status(503).send({ "message": "Worker is doing shit, try again later..." });
		return;
	}

	mongo.getTemplate(templateId, (template) => {
		imWorking = true;
		let currentMillis = (new Date()).getTime();
		let filename = 'faces/' + currentMillis + '.' + faceUrl.split('.').pop();
		req.get(faceUrl)
			.on('error', function (err) {
				imWorking = false;
				console.log(err);
			}).pipe(fs.createWriteStream(filename)
				.on('finish', function () {
					buildFrames(filename, currentMillis, template, resizedFactor, request.body.caption, delayms, function (gifFilename) {
						imWorking = false;
						response.status(200).send({ "filename": gifFilename });

						fs.readdir('./edit', (err, files) => {
							if (err) throw err;

							for (const file of files) {
								fs.unlink(path.join('./edit', file), err => {
									if (err) throw err;
								});
							}
						});
					});
				}));
	});
});

let buildFrames = function (faceFilename, currentMillis, jsonFrames, resizePercentage, caption, delayms, callback) {
	let count = 0;
	let framesCount = jsonFrames.frames.length;
	let frameFinished = _.after(framesCount, function () { return buildLoop(currentMillis, delayms, callback); });
	let tempJson = {};
	tempJson.frames = [];
	for (let frame of jsonFrames.frames) {
		count++;
		let width = frame.width;
		let height = frame.height;
		let top = frame.top;
		let left = frame.left;
		let angle = frame.angle;
		let resizedWidth = (width / 100) * resizePercentage + width;
		let resizedHeight = (height / 100) * resizePercentage + height;
		top = top - (((width / 100) * resizePercentage) / 2);
		left = left - (((height / 100) * resizePercentage) / 2);
		let cordinates = left + ',' + top + ' ' + resizedWidth + ',' + resizedHeight;
		let fontSizeTwoLines = 20;
		let frameImage = 'public/template/' + jsonFrames.gifid + "/" + frame.filename;
		let editedFrameImage = './edit/edited_' + zeroPrefix(count) + '.png';

		exec('convert ' + frameImage + ' \\( ' + faceFilename + ' -resize ' + resizedWidth + 'x' + resizedHeight + ' -virtual-pixel None +distort SRT 0,0,1,' + angle + ',' + left + ',' + top + ' \\) -layers flatten -resize x240 ' + editedFrameImage, (e, stdout, stderr) => {
			if (e instanceof Error) {
				console.error(e);
				throw e;
			}
			frameFinished();
		});
	}
}

buildLoop = (currentMillis, delayms, callback) => {
	let gifFilename = currentMillis + '.gif';
	gm('edit/edited_*.png').delay(delayms).loop('0').write('./public/' + gifFilename, function (err) {
		if (err) console.log(err);
		callback(gifFilename);
	});
}

stringDivider = (str, width, spaceReplacer) => {
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

zeroPrefix = (count) => {
	if (count < 10) {
		return '000' + count;
	} else if (count < 100) {
		return '00' + count;
	} else {
		return '0' + count;
	}
}


app.listen(8085, function () {
	console.log('Supa Hot on port 8085!');
});
