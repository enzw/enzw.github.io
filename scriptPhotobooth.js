document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("videoElement");
  const canvas = document.getElementById("canvas");
  const countdown = document.getElementById("countdown");
  const context = canvas.getContext("2d");

  const snapBtn = document.getElementById("snap");
  const resetBtn = document.getElementById("reset");

  const photoElements = [
    document.getElementById("photo1"),
    document.getElementById("photo2"),
    document.getElementById("photo3")
  ];

  let currentPhotoIndex = 0;

  // Aktifkan kamera
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((err) => {
      console.error("Error accessing camera:", err);
      alert("Kamera tidak dapat diakses.");
    });

  // Fungsi countdown
  function startCountdown(seconds) {
    return new Promise((resolve) => {
      let count = seconds;
      countdown.textContent = count;
      countdown.style.display = "flex";

      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          countdown.textContent = count;
        } else {
          clearInterval(interval);
          countdown.style.display = "none";
          resolve();
        }
      }, 1000);
    });
  }

  function capturePhoto(index) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  
    // Flip horizontal
    context.save(); // Simpan state awal canvas
    context.translate(canvas.width, 0); // Geser ke kanan
    context.scale(-1, 1); // Balik horizontal
  
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
    context.restore(); // Kembalikan transformasi seperti semula
  
    const dataURL = canvas.toDataURL("image/png");
  
    const photoDiv = photoElements[index];
    if (photoDiv) {
      photoDiv.style.backgroundImage = `url(${dataURL})`;
    }
  }
  

  // Ambil 3 foto secara berurutan dengan delay
  async function takeThreePhotos() {
    currentPhotoIndex = 0;
    for (let i = 0; i < photoElements.length; i++) {
      await startCountdown(3);
      capturePhoto(i);
    }
  }

  // Event tombol Snap
  snapBtn.addEventListener("click", (e) => {
    e.preventDefault();
    takeThreePhotos();
  });

  // Event tombol Reset
  resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    photoElements.forEach((el) => {
      el.style.backgroundImage = "";
    });
    currentPhotoIndex = 0;
  });
});
