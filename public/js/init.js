$(document).ready(function () {


            var socket = io.connect('http://localhost:3001');

             var image_link = artist =album  =  title = '';
            socket.on('convertStatus', function (data) {
        
                $("#socketData").text(data);
            });
            socket.on('scanRes', function (data) {
               $('#filesList').empty();

               $.each(data, function (index, value) {
                    $('#filesList').append("<li>" + value + "</li>");
               });
            })

            // Get All List Db
            socket.on('getAllList', function (list) {
                $('#dblistcont').empty();
               $.each(list, function (index, value) {
                    $('#dblistcont').append("<li><span class='list_del glyphicon glyphicon-remove' data-id='"+value.id+"' aria-hidden='true' title='remove'></span> | <input type='checkbox' name='list' value='"+value.id+"' title='check'> "  + value.path + "</li>");
               });
            })

            socket.on('showAllList', function (list) {

                $('#list_cont').empty();
               $.each(list, function (index, value) {
                    $('#list_cont').append("<li><input type='checkbox' name='list' value='"+value.id+"' title='check'> "  + value.path + "</li>");
               });
            })

            // Get All Palylist Db
            var x = 1;
            socket.on('getAllPlayList', function (list) {
                 $('#accordion2').empty();
                
               $.each(list, function (index, value) {

                   var play_list = value.play_list;
                   var playlist_id = value.playlist_id;
                   var list_path = play_list.split("###");
                   var list_id = playlist_id.split("#");
                   //$('#playlist_c').append("<li class='playlist_item'>" + value.playlistName + "<sup style='color:red; font-size:10px'>"+value.namesCount+"</sup><ul class='sub_list_"+x+"'></ul></li>");
                   $('#accordion2').append('<div class="accordion-group">'
                                             + '<div class="accordion-heading">'
                                              + ' <a class="accordion-toggle" data-toggle="collapse"  data-play_id="'+value.id+'" data-parent="#accordion2" href="#collapse'+x+'">'
                                               +  value.playlistName
                                                + '</a><span class="glyphicon glyphicon-edit playlist-edit" aria-hidden="true" data-play_id="'+value.id+'" data-play_name="'+value.playlistName+'"  data-toggle="modal" data-target="#myModal"></span>'
                                                + '</a> | <span class="playlist_del glyphicon glyphicon-remove" data-id="'+value.id+'" aria-hidden="true" title="remove"></span>'
                                             + ' </div>'
                                              + '<div id="collapse'+x+'" class="accordion-body collapse sub_list_'+x+'">'
                                             + '</div>'
                                        + '</div>');
                  
                     for(var i = 0; i<list_path.length; i++){
                      var url = list_path[i];
                      var urls_id = list_id[i];
                        //$('.sub_list_'+x).append("<li data-path='"+url+"' data-artist='"+artist+"' data-title='"+title+"' data-img='"+image_link+"'>"+url+"</li>"); 
                        $('.sub_list_'+x).append("<div class='accordion-inner'  data-list_id='"+value.id+"' data-item_id='"+urls_id+"' data-path='"+url+"' data-artist='"+artist+"' data-title='"+title+"' data-img='"+image_link+"'>"+url+"</div>"); 
                     }
                        x++;  
                       
                    });

                    
               });


            socket.on('convertProgress', function (data) {
                $("#p1").attr("value", data.progress);
                $("#filePath").text(data.path);
            });  



            socket.on('deleteSuccess', function (data) {
                $(".list_del").each(function(){
                  if($(this).data("id")==data){
                    $(this).closest('li').text("removed...").delay(800).slideToggle();
                  }
                })
            });  
            socket.on('deleteSuccessList', function (data) {
                $(".playlist_del").each(function(){
                  if($(this).data("id")==data){
                    $(this).closest('.accordion-group').text("removed...").delay(800).slideToggle();
                  }
                })
            }); 
            socket.on('deleteSuccessListItem', function (data) {
                $(".playlist_item_del").each(function(){
                  if($(this).data("playlist_id")==data.playlist_id && $(this).data("item_id")==data.item_id){
                    $(this).closest('li').text("removed...").delay(800).slideToggle();
                  }
                }) 
                $(".accordion-inner").each(function(){
                  if($(this).data("list_id")==data.playlist_id && $(this).data("item_id")==data.item_id){
                   $(this).remove();
                  }
                })
            }); 
            socket.on('updateSuccess', function (data) {
                $(".accordion-toggle").each(function(){
                  if($(this).data("play_id")==data.playlist_id ){
                    $(this).text(data.playlist_name);
                  }
                }) 
                $(".playlist_updatename").removeClass("glyphicon-refresh");
                 $(".playlist_updatename").addClass("glyphicon-ok");
            }); 
             // disk inffo 

            socket.on('diskInfo', function (data) {
              $('.all_disk_list').empty();
               console.log(data);
               data.forEach(function(val){
                $(".all_disk_list").append("<li><input type='checkbox' name='disk_list' value='"+val.mounted+"'><span>" +val.mounted+'</span> <div class="progress"> <div class="progress-bar progress-bar-info" role="progressbar" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" style="width:'+val.capacity+'">'+val.capacity+'</div>' +"</li>")
               })
               
            });
           
            // crate play list

            $(".refresh_list").click(function(){
              socket.emit("refreshAllList","x")
            })
            $(".refresh_playlist").click(function(){
              socket.emit("refreshPlayList","x")
            })
            $(".refresh_disklist").click(function(){
              socket.emit("refreshDiskList","x")
            })
             $(document).on('click',".playlist-edit",function(){ 
                var play_id = $(this).data("play_id");
                var play_name = $(this).data("play_name");
                $("#show_all_list").fadeOut(1);
                //$("#list_cont").empty();
                $(".add_new_music").attr("data-play_id",play_id);
                $(".btn_all_list").attr("data-play_id",play_id);
                var str1 = "<input type='text' name='play_name' class='play_name' value='"+play_name+"'><span class='playlist_change glyphicon glyphicon-ok' data-id='"+play_id+"' aria-hidden='true'></span><span class='error_length'>Please Enter length > 0</span>"; 
                var str2='';

                $(this).closest('.accordion-group').find('.accordion-inner').each(function(){

                    str2+= "<li><span class='playlist_item_del glyphicon glyphicon-remove' data-playlist_id='"+play_id+"' data-item_id='"+$(this).data("item_id")+"' aria-hidden='true' title='remove'></span> | "  + $(this).data("path") + "</li>"

                })
                $(".modal-body .play-cont").html(str1);
                $(".modal-body ol").html(str2);
            })

            $(document).on('click',".list_del",function(){
                var list_id =  $(this).data("id");
                socket.emit("listRemoveItem",list_id);
            })
            $(document).on('click',".playlist_del",function(){
                var playlist_id =  $(this).data("id");
                socket.emit("playListRemoveItem", playlist_id);
            })
            $(document).on('click',".playlist_del",function(){
                var playlist_id =  $(this).data("id");
                socket.emit("playListRemoveItem", playlist_id);
            }) 
            $(document).on('click',".playlist_item_del",function(){

                var playlist_id =  $(this).data("playlist_id");
                var item_id =  $(this).data("item_id");
                socket.emit("playListItemRemoveItem", {playlist_id:playlist_id,item_id:item_id});
            }) 
            $(document).on('click',".playlist_updatename",function(){
               var playlist_id =  $(this).data("id");
               var playlist_name = $('.play_name').val();
               socket.emit("playListINameUpdate", {playlist_id:playlist_id,playlist_name:playlist_name});
            })
            


            $(document).on('click',".btn_all_list",function(){
              var play_id = $(this).attr("data-play_id");
               if($("#list_cont li").length===0){
                  socket.emit("addNewMusic", play_id);
               };   
               $("#show_all_list").slideToggle();
            })
            $(document).on('click',".add_new_music",function(){
             var playlist_id =  $(this).attr("data-play_id");
               var pl_list = [];
               var str='';
                $("#list_cont input").each(function(){
                    if($(this).is( ":checked" )){
                        //alert(this.value);
                        pl_list.push(this.value);
                        str+= "<li><span class='playlist_item_del glyphicon glyphicon-remove' data-playlist_id='"+playlist_id+"' data-item_id='"+this.value+"' aria-hidden='true' title='remove'></span> | "  + $(this).closest("li").text() + "</li>";

                    }
                })
                if (pl_list.length>0 ) {
                 
                   socket.emit("addNewMuiscItem",{pl_list:pl_list,playlist_id:playlist_id});
                    $(".modal-body ol").append(str);
                }

            })

           var list_name = ''; 
          



          $(document).on('focus',".play_name",function(){
    
              list_name = $(this).val();
          })
          $(document).on('keyup',".play_name",function(){
              if($(this).val().length >0){
                  $(".error_length").fadeOut();
                  $(".playlist_change").fadeIn();
                  if( list_name.toLowerCase() !== $(this).val().toLowerCase()){
                     $(".playlist_change").removeClass("glyphicon-ok");
                     $(".playlist_change").addClass("glyphicon-refresh").addClass("playlist_updatename");
                  }else{
                    $(".playlist_change").removeClass("glyphicon-refresh");
                    $(".playlist_change").addClass("glyphicon-ok");
                  }
              }else{
                  $(".playlist_change").fadeOut();
                  $(".error_length").fadeIn();
              }
              
          })


            $(document).on('click',".accordion-toggle",function(){
             var arr_list = [];
             var list_path = '';
              var pla_list = {};
              //var $li= $(this).find("ul li");
              var $li= $(this).closest('.accordion-group').find(".accordion-inner");
              var k=0;
              var len = $li.length;
              $li.each(function(){

                list_path = $(this).attr("data-path");

                        console.log(list_path);
                        var urls = "http://localhost:3000/media/"+list_path;
                           ID3.loadTags(urls, function() {
                           
                            var tags = ID3.getAllTags(urls);
                            console.log(tags);
                             image = tags.picture;
                             image_link = "";
                             artist = tags.artist;
                             album  = tags.album;
                             title = tags.title;

                              
                              if (artist === undefined) {
                                artist = "Unknown artist";
                              }
                              if (title === undefined) {
                                var str = urls.split("/");
                                var str2 = str[str.length-1];
                                str2=str2.split(".mp3");
                                 title = str2[0]; 
                              } 



                             console.log(artist);
                           if (image) {
                              var base64String = "";
                              for (var i = 0; i < image.data.length; i++) {
                                  base64String += String.fromCharCode(image.data[i]);
                              }
                              var img_base64 = "data:" + image.format + ";base64," +
                              window.btoa(base64String);
                              image_link = img_base64;
                            } else {
                              image_link = "http://localhost:3000/img/player_bg.jpg";
                            }
                              pla_list = {
                              title: title,
                              artist: artist,
                              mp3: urls,
                              poster: image_link
                            }; 

                              arr_list.push(pla_list);
                             k++;
                             if(k==len){
                                 myPlaylist.setPlaylist( arr_list );
                              }
                        }, {
                          tags: ["title","artist","album","picture"]
                        })
                          

              })
              console.log(k+":"+len);
              // alert(2);
              
              
             
            })

            $("#create_playlist").click(function(){
            var pl_list = [];
                $("#dblistcont input").each(function(){
                    if($(this).is( ":checked" )){
                        //alert(this.value);
                        pl_list.push(this.value);
                    }
                })
                if(pl_list.length >0){
                  var pl_list_name = prompt("Please enter Play List  name", "playlist 1");
                  if (pl_list.length>0 && pl_list_name != null) {
                     socket.emit("create play list",{pl_list:pl_list,pl_list_name:pl_list_name});
                  }
                }else{
                  alert("Choose any file")
                }  

            })
            $(".check_all").click(function(){
                if($(this).prop("checked")){
                  $("#dblistcont input").prop("checked",true);
                }
                else{
                   $("#dblistcont input").prop("checked",false);
                }  
            })
           
            
            //Scan Media Files
             $("#scanFiles").click(function (e) {
                e.preventDefault();
                 var disk_list = [];
                  $(".all_disk_list input").each(function(){
                    if($(this).is( ":checked" )){
                        //alert(this.value);
                        disk_list.push(this.value);
                    }
                })
                console.log(disk_list);
                if(disk_list.length>0){
                 socket.emit("scan",disk_list);
                }else{
                  alert("Choose any directory")
                }
                
            });
            $("#scanConvertFiles").click(function (e) {
                e.preventDefault();
                 socket.emit("rowTbl","C:/xampp/htdocs/InKafee/app/ConvertedFiles");
                
            });
            

            //Convert Media Files
            

///////////////////////////  jPlayerPlaylist      ///////////////////////////////////////////////

var myPlaylist = new jPlayerPlaylist({
      jPlayer: "#jquery_jplayer_N",
      cssSelectorAncestor: "#jp_container_N"
      }, [
      {
      title:"Cro Magnon Man",
      artist:"The Stark Palace",
      mp3:"http://www.jplayer.org/audio/mp3/TSP-01-Cro_magnon_man.mp3",
      poster: "http://localhost:3000/img/player_bg.jpg"
      }
      ], {
      playlistOptions: {
      enableRemoveControls: true
      },
      swfPath: "../../dist/jplayer",
      supplied: "webmv, ogv, m4v, oga, mp3",
      useStateClassSkin: true,
      autoBlur: false,
      smoothPlayBar: true,
      keyEnabled: true,
      audioFullScreen: true
      });
      // Click handlers for jPlayerPlaylist method demo
      // Audio mix playlist
      $("#playlist-setPlaylist-audio-mix").click(function() {
      var obj = {
      title:"Cro Magnon Man",
      artist:"The Stark Palace",
      mp3:"http://www.jplayer.org/audio/mp3/TSP-01-Cro_magnon_man.mp3",
      oga:"http://www.jplayer.org/audio/ogg/TSP-01-Cro_magnon_man.ogg",
      poster: "http://www.jplayer.org/audio/poster/The_Stark_Palace_640x360.png"
      };
      myPlaylist.setPlaylist([
      obj
      ]);
      });
    
///////////////////////////  END jPlayerPlaylist      ///////////////////////////////////////////////



});