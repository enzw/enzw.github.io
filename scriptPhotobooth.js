navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                // Menghubungkan stream video ke elemen video
                const videoElement = document.getElementById('videoElement');
                videoElement.srcObject = stream;
            })
            .catch(function(error) {
                console.error("Error accessing the camera: ", error);
            });