const archiver = require("archiver");
const ffmpeg = require("fluent-ffmpeg");
const stream = require("stream");
const ytdl = require("ytdl-core");
const ytpl = require("ytpl");

const error_handler = (type, err, res) => {
  console.log(`${type} Error: ${err.message}`);
  console.log(`Traceback: ${err.stack}`);
  res.status(500).end();
};

/**
 * format, url -> track info
 */
const getInfo = async (req, res) => {
  const { format, url } = req.body;
  console.log(req.body);

  const track = (title, url, index) => {
    return { title: title, url: url, index: index };
  };
  const obj = {
    track: new Array(0),
    title: null,
  };
  if (ytpl.validateID(url)) {
    try {
      const info = await ytpl.getPlaylistID(url).then((id) => ytpl(id));
      obj.title = info.title + ".zip";
      obj.track = info.items.map((v, i) => track(v.title + format, v.url, i));
    } catch (err) {
      return error_handler("YTPL", err, res);
    }
  }
  if (ytdl.validateURL(url)) {
    try {
      const info = await ytdl.getInfo(url).then((i) => i.videoDetails);
      obj.title = info.title + ".zip";
      obj.track = new Array(track(info.title + format, url, 0));
    } catch (err) {
      return error_handler("YTDL", err, res);
    }
  }
  res.status(200).send(obj);
};

/**
 * compress, socket id, track info -> stream
 */
const getFile = (req, res, io) => {
  const { compress, index, track } = req.body;
  const socket = io.to(index);
  console.log(req.body);

  // return a single track if compress is disabled
  if (!compress) {
    let pass1 = new stream.PassThrough();
    let pass2 = new stream.PassThrough();

    const dl = ytdl(track.url, { filter: "audioandvideo", quality: "highest" });
    dl.on("error", (err) => error_handler("YTDL", err, res));
    dl.on("progress", (_, d, total) => {
      let p = ((d / total) * 100).toFixed(2);
      process.stdout.write(`\r${p}% Downloaded`);
      socket.emit("update", parseFloat(p), track.index);
    });
    dl.on("end", () => console.log("YTDL Done"));
    dl.pipe(pass1);
    if (track.title.endsWith("mp4")) {
      return pass1.pipe(res);
    }
    const cv = ffmpeg(pass1).format("mp3");
    cv.on("error", (err) => error_handler("FFMPEG", err, res));
    cv.on("end", () => console.log("FFMPEG Done"));
    cv.pipe(pass2);
    if (track.title.endsWith("mp3")) {
      return pass2.pipe(res);
    }
  }
  // else return a zip file with multiple tracks
  const arc = archiver("zip", { zlib: { level: 9 } });
  arc.on("error", (err) => error_handler("ARCHIVER", err, res));
  arc.on("end", () => console.log("ARCHIVER Done"));
  arc.pipe(res);

  track.forEach((t) => {
    let pass1 = new stream.PassThrough();
    let pass2 = new stream.PassThrough();

    const dl = ytdl(track.url, { filter: "audioandvideo", quality: "highest" });
    dl.on("error", (err) => error_handler("YTDL", err, res));
    dl.on("progress", (_, d, total) => {
      let p = ((d / total) * 100).toFixed(2);
      process.stdout.write(`\r${p}% Downloaded`);
      socket.emit("update", parseFloat(p), t.index);
    });
    dl.on("end", () => console.log("YTDL Done"));
    dl.pipe(pass1);
    if (t.title.endsWith("mp4")) {
      return arc.append(pass1, { name: t.title });
    }
    const cv = ffmpeg(pass1).format("mp3");
    cv.on("error", (err) => error_handler("FFMPEG", err, res));
    cv.on("end", () => console.log("FFMPEG Done"));
    cv.pipe(pass2);
    if (t.title.endsWith("mp3")) {
      return arc.append(pass2, { name: t.title });
    }
  });
  arc.finalize();
};

module.exports = { getInfo, getFile };
