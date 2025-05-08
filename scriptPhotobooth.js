navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                const videoElement = document.getElementById('videoElement');
                videoElement.srcObject = stream;
            })
            .catch(function(error) {
                console.error("Error accessing the camera: ", error);
            });

const video = document.getElementById('videoElement');
const canvas = document.getElementById('canvas');
const countdown = document.getElementById('countdown');
const context = canvas.getContext('2d');

