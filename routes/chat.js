var express = require('express');
var router = express.Router();
var ffmpeg = require("fluent-ffmpeg");
var io = require('socket.io')();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('chat', { title: 'chat' });

    var source = ["music1.mp4","music2.mp4","music3.mp4"];
    var k = 0;
    var fileSrc = "d:\\m\\" + source[k];
    var fileTarget = "d:\\m\\" + source[k] + ".mp3";

    io.listen(3001);
    io.on('connection', function(socket){

        converter(fileSrc, fileTarget);

        function converter(S, T){
            var proc = new ffmpeg({source: S, nolog: false})
                .noVideo()
                .withAudioCodec('libmp3lame')
                .withAudioBitrate('192k')
                .withAudioChannels(2)
                .toFormat('mp3')
                .on('progress', function (progress) {
                    progressMsg = 'Processing: ' + S + ' ' + Math.floor(progress.percent) + '% done';
                    socket.emit('convertProgress', {"path" : S, "progress" : progress.percent});
                })
                .on('error', function (err, stdout, stderr) {
                    errorMsg = 'Cannot process video: ' + err.message;
                    console.log(errorMsg);
                    socket.emit('convertStatus', errorMsg);
                })
                .on('end', function () {
                    successMsg = 'Transcoding succeeded ! ' + T;
                    console.log(successMsg);
                    socket.emit('convertStatus', successMsg);
                    k++;
                    if(k < source.length) {
                        fileSrc = "d:\\m\\" + source[k];
                        fileTarget = "d:\\m\\" + source[k] + ".mp3";
                        converter(fileSrc, fileTarget);
                    }
                })
                .save(T);
        }
    });
});

module.exports = router;