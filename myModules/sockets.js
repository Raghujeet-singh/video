const routes = require(__dirname + "/routes.js");
const siofu = require('socketio-file-upload');
routes.app.use(siofu.router);
const io = require('socket.io').listen(routes.server);
const spawn = require('child_process').spawn;
const db = require(__dirname + '/DB/mongo.js');
const fs = require('fs');


const upMovie = (nam) => { // Add movie
    const repo = nam.slice(0, len-4);
    fs.mkdir("/mnt/Movies/"+repo, () => {
      fs.mkdir("/mnt/Movies/"+repo+"/subtitles", () => {
        fs.rename("/mnt/Temp/"+nam, "/mnt/Movies/"+repo+"/"+nam, () => {
        console.log("film déplacé!");
        db.addMovie(repo);
      });
    });
  });
}

const upVTT = (nam) => { // Add VTT
    const repo = nam.slice(0, len-4);
    db.getFilms({"nom": repo}, "nom", null, (result) => {
      //console.log(result);
      if(result[0]){
        fs.rename("/mnt/Temp/"+nam, "/mnt/Movies/"+repo+"/subtitles/"+nam, () => {
        console.log("Sous-titres ajoutés!");
      });
    }
  });
}

const upSRT = (nam) => { // Convert SRT to VTT
    const repo = nam.slice(0, len-4);
    db.getFilms({"nom": repo}, "nom", null, (result) => {
      //console.log(result);
      if(result[0]){
        fs.rename("/mnt/Temp/"+nam, "/mnt/Movies/"+repo+"/subtitles/"+nam, () => {
          spawn("node", ["/home/pi/node/SRTVTT/SRTVTT.js", "/mnt/Movies/"+repo+"/subtitles/"+repo+".srt", "/mnt/Movies/"+repo+"/subtitles/"+repo+".vtt"]);
          setTimeout(() => {
            fs.unlink("/mnt/Movies/"+repo+"/subtitles/"+repo+".srt", (err) => {
              if(err) console.log(err);
            })
          }, 1000);
        console.log("Sous-titres ajoutés!");
      });
    }
  });
}


io.on("connection", (socket) => {
    const uploader = new siofu();
    uploader.dir = "/mnt/Temp";
    uploader.listen(socket);

    socket.on("complete", (nam) => {
			const len = nam.length;
			const sliced = nam.slice(len-4, len);

			if(sliced === ".mp4" || sliced === ".ogg" || sliced === ".webm"){
				upMovie(nam);
      }

      else if(sliced === ".vtt"){
        upVTT(nam);
      }

  		else if(sliced === ".srt"){
        upSRT(nam);
  		}
  });
});

const start = (port) => {
  routes.server.listen(port);
  console.log("Bring Yourself Back Online");
}


module.exports = {
  io: io,
  start: start
}
