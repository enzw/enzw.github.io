  document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("videoElement");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const countdown = document.getElementById("countdown");
  const snapBtn = document.getElementById("snap");
  const resetBtn = document.getElementById("reset");

  const themes = {
    btn1: { color: "#FFC3C3", sticker: "images/sticker4.png" },
    btn2: { color: "#9FF9FF", sticker: "images/sticker3.png" },
    btn3: { color: "#F6B8FF", sticker: "images/sticker2.png" },
    btn4: { color: "#AEFFC6", sticker: "images/sticker1.png" }
  };

  const photoEls = [
    document.getElementById("photo1"),
    document.getElementById("photo2"),
    document.getElementById("photo3")
  ];

  // === AKSES KAMERA ===
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => { video.srcObject = stream; })
    .catch(err => { alert("Kamera tidak dapat diakses"); console.error(err); });

  // === SIMPAN FOTO ===
  const storePhoto = (idx, dataURL) => {
    const all = JSON.parse(localStorage.getItem("photobooth_photos") || "{}");
    all[`photo${idx + 1}`] = dataURL;
    localStorage.setItem("photobooth_photos", JSON.stringify(all));
  };

  // === HITUNG MUNDUR ===
  const startCountdown = sec => new Promise(res => {
    let n = sec;
    countdown.textContent = n;
    countdown.style.display = "flex";
    const iv = setInterval(() => {
      countdown.textContent = --n;
      if (n === 0) { clearInterval(iv); countdown.style.display = "none"; res(); }
    }, 1000);
  });

  // === TANGKAP FOTO ===
  const capturePhoto = idx => {
    // Gunakan ukuran tetap 908 x 903 px
    canvas.width = 908;
    canvas.height = 903;

    // Gambar video sesuai proporsi (dengan crop tengah)
    const videoAspect = video.videoWidth / video.videoHeight;
    const targetAspect = canvas.width / canvas.height;

    let sx, sy, sw, sh;

    if (videoAspect > targetAspect) {
      // Lebih lebar dari canvas → crop sisi kiri dan kanan
      sh = video.videoHeight;
      sw = sh * targetAspect;
      sx = (video.videoWidth - sw) / 2;
      sy = 0;
    } else {
      // Lebih tinggi dari canvas → crop atas dan bawah
      sw = video.videoWidth;
      sh = sw / targetAspect;
      sx = 0;
      sy = (video.videoHeight - sh) / 2;
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const dataURL = canvas.toDataURL("image/png");
    photoEls[idx].style.backgroundImage = `url(${dataURL})`;
    photoEls[idx].style.backgroundSize = "cover";
    storePhoto(idx, dataURL);
  };

  const takeThree = async () => {
    for (let i = 0; i < 3; i++) {
      await startCountdown(3);
      capturePhoto(i);
    }
  };

  // === EVENT ===
  snapBtn.addEventListener("click", e => { e.preventDefault(); takeThree(); });

  resetBtn.addEventListener("click", e => {
    e.preventDefault();
    photoEls.forEach(el => el.style.backgroundImage = "");
    localStorage.removeItem("photobooth_photos");
  });

  // === SIMPAN TEMA ===
  Object.entries(themes).forEach(([id, { color, sticker }]) => {
    document.getElementById(id).addEventListener("click", e => {
      e.preventDefault();
      localStorage.setItem("themeColor", color);
      localStorage.setItem("themeSticker", sticker);
    });
  });
});
