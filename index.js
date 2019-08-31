'use strict';
const mediaSource = new MediaSource();
let mediaRecorder;
let recordedBlobs;
let sourceBuffer;
let imageCapture;
let videoCount = 0;
let recordedVideoObj = [];
let audioStream,rec,input,audioContext;
let recordingList = document.getElementById('recordingsList')
let AudioContext = window.AudioContext || window.webkitAudioContext;
let recordAudioButton = document.getElementById("recordAudioButton");
let stopButton = document.getElementById("stopButton");
//add events to those 2 buttons
recordAudioButton.addEventListener("click", startAudioRecording);
stopButton.addEventListener("click", stopAudioRecording);
const video = document.querySelector('video');
const canvas = window.canvas = document.querySelector('canvas');
canvas.width = 480;
canvas.height = 360;
const errorMsgElement = document.querySelector('span#errorMsg');
const recordedVideo = document.querySelector('video#recorded');
const recordButton = document.querySelector('button#record');
recordButton.addEventListener('click', () => {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
  }
});


function startAudioRecording() {
	console.log("recordButton clicked");
    var constraints = { audio: true, video:false }
	recordAudioButton.disabled = true;
	stopButton.disabled = false;
	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		audioContext = new AudioContext();
		audioStream = stream;
		input = audioContext.createMediaStreamSource(stream);
		rec = new Recorder(input,{numChannels:1})
		rec.record()
    }).catch(function(err) {
    	recordAudioButton.disabled = false;
    	stopButton.disabled = true;
	});
}

function stopAudioRecording(){
    stopButton.disabled = true;
	recordAudioButton.disabled = false;
	rec.stop();
    audioStream.getAudioTracks()[0].stop();
    rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob){
    let url = URL.createObjectURL(blob);
	let au = document.createElement('audio');
	let li = document.createElement('li');
    li.id = 'audioFile';
	au.controls = true;
	au.src = url;
	li.appendChild(au);
    recordingsList.appendChild(li);
}

document.getElementById('takePicture').addEventListener('click',()=>{
  document.getElementById('myCanvas').style.display = 'block';
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height); 
});

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function startRecording() {
  recordedBlobs = [];
  let options = {mimeType: 'video/webm;codecs=vp9'};
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  recordButton.textContent = 'Stop Recording';
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10); // collect 10ms of data
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  recordedVideoObj[videoCount] = recordedBlobs;
  videoCount += 1;
  renderRecoderdVideo();
}

function playVideo(){
  document.getElementById('videoBox').style.display = 'flex';
  let recordedBlobs = recordedVideoObj[videoCount - 1]
  const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
  recordedVideo.play();   
    
}

function deleteRecordedVideo(){
    recordedVideoObj.splice(videoCount-1,1);
    videoCount -= 1;
    recordedVideo.src = '';
    recordedVideo.srcObj = '';
    let a = videoCount + 1;
    document.getElementById('videoBox_'+a).innerHTML = '';
}

function renderRecoderdVideo(){
        let outerDiv = document.createElement('div');
            outerDiv.id = 'videoBox_' + videoCount;
            outerDiv.className = 'recordedVideoBox'
        let playButtonDiv = document.createElement('div');
            playButtonDiv.innerHTML = 'playVideo'+videoCount;
            playButtonDiv.id = 'playVideo';
        let deleteButtonDiv = document.createElement('div');
            deleteButtonDiv.innerHTML = 'deleteVideo' + videoCount;
            deleteButtonDiv.id = 'deleteVideo';
        outerDiv.append(playButtonDiv);
        outerDiv.append(deleteButtonDiv);
        playButtonDiv.addEventListener("click", function () {
             playVideo();
        });
        deleteButtonDiv.addEventListener("click", function () {
              deleteRecordedVideo();
        });
        document.getElementById('recordedVideoList').appendChild(outerDiv);
    
}

function handleSuccess(stream) {
  recordButton.disabled = false;
  console.log('getUserMedia() got stream:', stream);
  window.stream = stream;
  video.srcObject = stream;

  const videoPlayer = document.querySelector('video#videoPlayer');
  mediaRecorder = new MediaRecorder(stream);
  videoPlayer.srcObject = stream;
}

async function init(constraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
  } catch (e) {
    console.error('navigator.getUserMedia error:', e);
    errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
  }
}

document.querySelector('button#start').addEventListener('click', async () => {
  const constraints = {
    video: true
  };
  console.log('Using media constraints:', constraints);
  await init(constraints);
});
