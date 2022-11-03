import React, { useState, useEffect } from "react";
import { Button, Col, Form, Jumbotron, Spinner } from "react-bootstrap";
import BootstrapSwitchButton from "bootstrap-switch-button-react";
import io from "socket.io-client";

const server = "http://localhost:5000";
const socket = io(server);

const encode = (data) => {
  let obj = {};
  data.forEach((v, k) => (obj[k] = v));
  return JSON.stringify(obj);
};

const escape = (file) => {
  let chars = ["/", "*", "?", ">", "<", "|", "\\", '"', ":"];
  for (let i = 0; i < chars.length; i++) {
    file = file.replace(chars[i], " ");
  }
  return file;
};

const getInfo = async (data) => {
  return fetch(server + "/api/get-info", {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: encode(data),
  })
    .then((res) => {
      if (res.ok) return res.json();
      throw new Error("Internal Error");
    })
    .catch((err) => {
      window.alert(err.message);
      window.location.replace("/");
    });
};

const getFile = async (data) => {
  return fetch(server + "/api/get-file", {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (res.ok) return res.blob();
      throw new Error("Internal Error");
    })
    .catch((err) => {
      window.alert(err.message);
      window.location.replace("/");
    });
};

const Converter = () => {
  // average download progress of all tracks
  const [progress, setProgress] = useState(new Array(1).fill(0));
  // identify if download is ongoing
  const [process, setProcess] = useState(false);
  // status of compress option
  const [compress, setCompress] = useState(false);
  // unique socket id of each client
  const [index, setIndex] = useState(null);

  useEffect(() => {
    socket.on("create", (index) => {
      setIndex(index);
    });
    socket.on("update", (val, idx) => {
      setProgress((prev) => prev.map((v, i) => (i === idx ? val : v)));
    });
    socket.emit("ready");
  }, []);

  const onChange = () => setCompress(!compress);

  const onSubmit = async (event) => {
    const data = new FormData(event.target);
    event.preventDefault();

    setProgress(new Array(1).fill(0));
    setProcess(true);

    const { title, track } = await getInfo(data);
    if (track.length === 0) {
      window.alert("Invalid URL");
      window.location.replace("/");
    }
    // reset download progress with returned info
    setProgress(new Array(track.length).fill(0));

    const info = { compress: compress, index: index };

    const promises = compress
      ? new Array(getFile({ track: track, ...info }))
      : track.map((t) => getFile({ track: t, ...info }));
    const blobs = await Promise.all(promises);

    // download files when all promises resolved
    blobs.forEach((b, i) => {
      let file = compress ? title : track[i].title;
      let a = document.createElement("a");
      a.href = window.URL.createObjectURL(b);
      a.download = escape(file);
      setTimeout(() => a.click(), i * 100);
    });
    setProcess(false);
  };

  let text = ` DOWNLOAD`;
  if (process) {
    let sum = progress.reduce((a, b) => a + b);
    let avg = (sum / progress.length).toFixed(2);
    text += `ING... ${avg}%`;
  }
  return (
    <Jumbotron>
      <Form onSubmit={onSubmit}>
        <Form.Control type="url" name="url" />
        <Form.Row>
          <Col>
            <Form.Label>Format</Form.Label>
            <Form.Control as="select" name="format">
              <option value=".mp3">MP3</option>
              <option value=".mp4">MP4</option>
            </Form.Control>
          </Col>
          <Col>
            <Form.Label>Compress</Form.Label>
            <BootstrapSwitchButton
              onChange={onChange}
              checked={compress}
              onstyle="secondary"
              onlabel="Enabled"
              offstyle="secondary"
              offlabel="Disabled"
            ></BootstrapSwitchButton>
          </Col>
        </Form.Row>
        <Button type="submit" disabled={process}>
          <Spinner
            style={{ display: process ? "inline-block" : "none" }}
            animation="grow"
            size="sm"
          ></Spinner>
          {text}
        </Button>
      </Form>
    </Jumbotron>
  );
};

export default Converter;
