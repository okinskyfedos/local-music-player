var http = require('http');
var express = require('express');
var app = express();
var router = express.Router();
var mysql = require('mysql');
var walk = require('walk');
var ffmpeg = require("fluent-ffmpeg");
var path = require('path');
var appRoot = require('app-root-path');
var fs = require('fs');
var diskinfo = require('diskinfo');
var exec = require('child_process').exec;

/*var io = require('socket.io')();*/
var server = http.createServer(app).listen(3001);
var io = require('socket.io').listen(server,{log:false, origins:'*:*'});

var k = 0;
var s = 1; 
var mediapath = 'media/'; 
var source = [];
var disk = [];
var files = [];
var all_disk = [];
var archiveRoot = appRoot + "\\ConvertedFiles";
if (!fs.existsSync(archiveRoot)) {
    fs.mkdirSync(archiveRoot);
}

/*Create mysql connection*/
var conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'inKaffee'
});


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

/* POST home page. */
router.post('/', function (req, res) {

});


var m=0;
io.on('connection', function(socket) {
var z=0;    
    console.log("connected!!!!");
    diskInfo();
    getAllList();
    getAllPlayList();



    socket.on("scan",  function(disk_dist){
        files = [];
        console.log("scan!!");
        console.log(z);    
        console.log(disk_dist);
        all_disk = disk_dist;
        var filePath = selfpath = newMediaFilePath = newMediaFile = '';
        walks();
        function walks(){
                var dir  = disk_dist[z]+"/mediaFile";
                var walker = walk.walk(dir, {followLinks: false});

                walker.on('file', function (root, stat, next) {
                    var pr = stat.name.split(".");
                    var popped = pr.pop();
                    var ext = ["avi", "mp4", "mp3", "wav"];
                   // if (stat.name.match('^.*\.(avi|mp4|wav|)$')) {
                    if(ext.indexOf(popped)!=-1){
                        if(popped=="mp3"){
                                filePath = path.join(root, '\\\\', stat.name);
                                selfpath = fs.createReadStream(filePath);
                                newMediaFilePath = mediapath + stat.name;
                                newMediaFile = fs.createWriteStream("public/"+newMediaFilePath);

                                selfpath.pipe(newMediaFile);

                                files.push(stat.name);
                              
                        }
                       else{
                        console.log("o_____-______o");
                          console.log(dir);
                          console.log(stat.name);
                        console.log("/_____-______/");  
                          source.push(dir+"/"+stat.name);
                          
                        }
                       
                    }
                    next();
                });
                walker.on('end', function () { 
                   //res.send(files);
                   socket.emit("scanRes",files);
                   console.log("------------------------");
                   console.log(z);
                   console.log(files);

                    //addScanedToDB(files);
                    z++;
                    if(z<disk_dist.length){
                        walks();
                    }
                    else{
                       //z = 0;
                    }
                    if(source.length>0){
                       k=0;
                        console.log(source);
                         cons();
                    }
                    console.log("--------------");
                    console.log(z);
                   if(z>=disk_dist.length && source.length==0){
                         addScanedToDB(files);
                         console.log("-----!-----------");
                   }

                });


    }


    })
   
    socket.on('con',  function(msg){
        
    })
   // create play list
   socket.on('create play list', function (msg) {
        console.log(msg);
       // var queryStr = "CREATE TABLE IF NOT EXISTS playlist (id int(16) unsigned NOT NULL auto_increment, list_name varchar(1024) NOT NULL default '0', list_id int(10) NOT NULL default '0', PRIMARY KEY  (id)) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8";
        var queryStr = "CREATE TABLE IF NOT EXISTS playlist (id int not null auto_increment primary key, playlistName varchar(250) not null )";
        conn.query(queryStr, function (error, result, fields) {
            if (error) {
                console.log(error.code);
            } else {
            var qStr = "CREATE TABLE IF NOT EXISTS playlist_media ( id int not null auto_increment primary key, playlistID int not null, foreign key (playlistID) references playlist(id) ON DELETE CASCADE ON UPDATE CASCADE, mediaID int not null, foreign key (mediaID) references media(id) ON DELETE CASCADE ON UPDATE CASCADE )";
                
             conn.query(qStr, function (error, result, fields) {
            if (error) {
               console.log(error.code);
            }
        })


                var playlist_ID = '';
                 conn.query("INSERT INTO playlist (playlistName) VALUES ('" + msg.pl_list_name + "')", function (error, rows) {
                            if (error) {
                                 console.log(error.code);
                             } else {
                                 //console.log("DB rows inserted - OK");
                                  playlist_ID = rows.insertId;
                                   var pl_list_id = msg.pl_list;
                                   var g=1;
                    pl_list_id.forEach(function(val){
                        conn.query("INSERT INTO playlist_media (playlistID,mediaID) VALUES ('" + playlist_ID + "','"+val+"')", function (error, rows) {
                        if (error) {
                                 console.log(error.code);
                             }else{
                                if(pl_list_id.length==g){
                                    getAllPlayList();
                                }
                                g++;
                             }

                        })
                       
                    })
                            }
                    });  
                   
             }       
        })
    });
    
    socket.on('refreshAllList', function () {
       getAllList();
    });

    socket.on('refreshPlayList', function () {
       getAllPlayList();
    });
    socket.on('refreshDiskList', function () {
       diskInfo();
    });
    socket.on('listRemoveItem', function (msg) {
        conn.query('DELETE FROM media WHERE id="'+msg+'"',  function (err, result) {
          if (err) throw err;
         
          console.log('deleted ' + result + ' rows');
          socket.emit('deleteSuccess', msg);
        })
    });
    socket.on('playListRemoveItem', function (msg) {
        conn.query('DELETE FROM playlist WHERE id="'+msg+'"',  function (err, result) {
          if (err) throw err;
         
          console.log('deleted ' + result + ' rows');
          socket.emit('deleteSuccessList', msg);
        })
    }); 
    socket.on('playListItemRemoveItem', function (msg) {
        conn.query('DELETE FROM playlist_media WHERE  playlistID="'+msg.playlist_id+'" AND mediaID="'+msg.item_id+'"',  function (err, result) {
          if (err) throw err;
         
          console.log('deleted ' + result + ' rows');
          socket.emit('deleteSuccessListItem', msg);
        })
    console.log(msg);
    });
    socket.on('playListINameUpdate', function (msg) {
        
        conn.query('UPDATE playlist SET playlistName="'+msg.playlist_name+'" WHERE id="'+msg.playlist_id+'"', function (err, result) {
          if (err) throw err;
         
          console.log('changed ' + result.changedRows + ' rows');
          socket.emit('updateSuccess', msg);
        })
    });

    socket.on('addNewMusic', function (msg) {
      getItemList();
    });
    socket.on('addNewMuiscItem',function(msg){
        var playlist_ID =msg.playlist_id; 
        var item_id = msg.pl_list;
        var g = 1;
        item_id.forEach(function(val){
            conn.query("INSERT INTO playlist_media (playlistID,mediaID) VALUES ('" + playlist_ID + "','"+val+"')", function (error, rows) {
                if (error) {
                         console.log(error.code);
                  } else {
                    if(item_id.length==g){
                        getAllPlayList();
                        socket.emit('updAllPlayListItem', "msg");
                    }
                    g++;
                    

                 }    
            })        
        })
        
    })
    socket.on('disconnect', function () {
        console.log('user disconnected');
        source.length = 0; 
        disk.length = 0; 

    });
     function cons(){
      console.log("_________--------------_____--------------____");
        console.log(source);
        console.log(k);
        //source = ["music1.mp4", "music2.mp4"];
       // var fileSrc = "d:\\mediaFile\\" + source[k];
      var fileSrc =source[k];
      console.log(fileSrc);
       var st = fileSrc.split("/");

        var fileTarget = appRoot.path+"/public/media/" + st[st.length-1] + ".mp3"; 
        console.log(fileTarget);
        fs.exists(fileTarget, function (exists) {
          console.log(exists ? "it's there" : 'no passwd!');
          if(!exists){
                ++s;
                converter(fileSrc, fileTarget);
            }else{
                
                if(s < source.length){
                    ++s;
                    ++k;
                    cons();
                }else{
                    addScanedToDB(files);
                    console.log(s);
                    console.log("XXXXXXXX");
                    console.log(files);    
                }

                
            }
        });
        ++m;
        if(m>=source.length){
          // addScanedToDB(files);
           //console.log(files);
        }
        
     }   
    function converter(S, T) {
        console.log("convert");
                var proc = new ffmpeg({source: S, nolog: false})
                    .noVideo()
                    .withAudioCodec('libmp3lame')
                    .withAudioBitrate('192k')
                    .withAudioChannels(2)
                    .toFormat('mp3')
                    .on('progress', function (progress) {
                        progressMsg = 'Processing: ' + S + ' ' + Math.floor(progress.percent) + '% done';
                        socket.emit('convertProgress', {"path": S, "progress": progress.percent});
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

                        console.log({source: S});
                        var st = T.split("/");
                        files.push(st[st.length-1]);
                        console.log({source: st[st.length-1]});
                         

                        k++;
                        if (k < source.length) {
                           cons();
                        }else{

                         addScanedToDB(files);
                         console.log("$$$$$$$$$$$$$$$$$$$$$");
                         console.log(files); 
                        }
                    })
                    .save(T);
    }
    var x = 1;
     function addScanedToDB(scanList) {
        z=0;
        var queryStr = "create table if not exists media ( id int not null auto_increment primary key, path varchar(250) not null )";
        conn.query(queryStr, function (error, result, fields) {
            if (error) {
               // console.log(error.code);
            } else {
                var stepscan = scanList.length;
                console.log("DB table created - OK");
                console.log(scanList.length);
                scanList.forEach(function (scanItem) {
                    console.log(scanItem);
                    var scanItem_rep=scanItem.replace(/\\/gi, "\\\\");
                    conn.query( 'SELECT path FROM media WHERE path="'+ scanItem_rep +'" ', function(err, rows) {
                        if(rows.length==0){
                             conn.query("INSERT INTO media (path) VALUES ('" + scanItem_rep + "')", function (error, rows) {
                             if (error) {
                                    console.log(error.code);
                                } else {
                                  
                                }
                            });
                        }

                    });
                  if(x == stepscan){
                        console.log("scan complited");
                        getAllList();
                        x=1;
                    }
                  
                   x++; 
                })
            }
        });
    }
    function getAllList(k){
        console.log("dddddddd");
        conn.query( 'SELECT * FROM media ', function(err, rows) {
            console.log(rows);
        if(typeof rows !== "undefined")   {
            console.log("lkkkkkkkk");
            if(rows.length>0){
        
                 socket.emit("getAllList",rows);
            
            }
        }        
          
         });


    }
    function getItemList(){
        conn.query( 'SELECT * FROM media ', function(err, rows) {
        console.log(rows);
        if(typeof rows !== "undefined")   {
            if(rows.length>0){
                socket.emit("showAllList",rows);
             }   
        }      
          
        });
    }
    function getAllPlayList(){
        conn.query( 'SELECT playlist.id, playlist.playlistName, COUNT(*) AS namesCount, GROUP_CONCAT(media.path SEPARATOR "###") as play_list, GROUP_CONCAT( media.id SEPARATOR "#") as playlist_id FROM playlist INNER JOIN playlist_media ON playlist.ID = playlist_media.playlistID INNER JOIN media ON playlist_media.mediaID = media.ID GROUP BY playlist.playlistName', function(err, rows) {
            if(typeof rows !== "undefined")   {
                if(rows.length>0){
                    console.log(rows);
                     socket.emit("getAllPlayList",rows);
                    }
                }        
              
            });
    }
    function diskInfo(){
         diskinfo.getDrives(function(err, aDrives) {
         var diskitem = {}; 
         disk = [];  
            for (var i = 0; i < aDrives.length; i++) {
                console.log('Drive ' + aDrives[i].filesystem);
                console.log('blocks ' + aDrives[i].blocks);
                console.log('used ' + aDrives[i].used);
                console.log('available ' + aDrives[i].available);
                console.log('capacity ' + aDrives[i].capacity);
                console.log('mounted ' + aDrives[i].mounted);
                console.log('-----------------------------------------');
                diskitem = {
                     Drive : aDrives[i].filesystem,
                     blocks : aDrives[i].blocks,
                     used : aDrives[i].used,
                     available : aDrives[i].available,
                     capacity : aDrives[i].capacity,
                     mounted : aDrives[i].mounted
                }
                disk.push(diskitem);
                if(i==aDrives.length-1 ){
                    console.log(disk);
                     aDrives.length=0;
                     socket.emit("diskInfo", disk)
                }
            } 
        });

    }
   





})
 




module.exports = router;
