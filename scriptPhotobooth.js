document.addEventListener("DOMContentLoaded", function () {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('canvas');
    const countdown = document.getElementById('countdown');
    const context = canvas.getContext('2d');
  
    const snapBtn = document.getElementById('snap');
    const resetBtn = document.getElementById('reset');
  
    const photo1 = document.getElementById('photo1');
    const photo2 = document.getElementById('photo2');
    const photo3 = document.getElementById('photo3');
  
    // Aktifkan kamera
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(function(stream) {
        video.srcObject = stream;
      })
      .catch(function(error) {
        console.error("Error accessing the camera: ", error);
      });
  
    // Fungsi countdown dengan Promise
    function startCountdown(seconds) {
      return new Promise((resolve) => {
        let count = seconds;
        countdown.textContent = count;
  
        const interval = setInterval(() => {
          count--;
          if (count > 0) {
            countdown.textContent = count;
          } else {
            clearInterval(interval);
            countdown.textContent = '';
            resolve(); // lanjutkan ke pengambilan foto
          }
        }, 1000);
      });
    }
  
    // Ambil foto dan tampilkan ke photo1, photo2, photo3
    function takePhoto(index) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
      const dataURL = canvas.toDataURL('image/png');
      const photo = document.getElementById(`photo${index}`);
      if (photo) {
        photo.style.backgroundImage = `url(${dataURL})`;
      }
      if (window.getComputedStyle(countdown).display === 'block') {
        countdown.style.display = 'none'
    }
    }
  
    // Fungsi utama: ambil 3 foto dengan delay
    async function takeThreePhotos() {
      for (let i = 1; i <= 3; i++) {
        countdown.style.display = 'block';
        await startCountdown(3); // tunggu countdown
        takePhoto(i);            // ambil foto ke-i
      }
    }
  
    // Tombol Snap
    snapBtn.addEventListener('click', function(e) {
      e.preventDefault();
      takeThreePhotos();
    });
  
    // Tombol Reset
    resetBtn.addEventListener('click', function(e) {
      e.preventDefault();
      context.clearRect(0, 0, canvas.width, canvas.height);
      photo1.style.backgroundImage = '';
      photo2.style.backgroundImage = '';
      photo3.style.backgroundImage = '';
    });
  });
  