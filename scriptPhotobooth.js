document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("videoElement");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const countdown = document.getElementById("countdown");

  const snapBtn = document.getElementById("snap");
  const resetBtn = document.getElementById("reset");
  const saveBtn = document.getElementById("save");
  const theme1 = document.getElementById("btn1");
  const theme2 = document.getElementById("btn2");
  const theme3 = document.getElementById("btn3");
  const theme4 = document.getElementById("btn4");

  const themes = {
    btn1: {
      color: "#FFC3C3",
      sticker: "images/sticker4.png"
    },
    btn2: {
      color: "#9FF9FF",
      sticker: "images/sticker3.png"
    },
    btn3: {
      color: "#F6B8FF",
      sticker: "images/sticker2.png"
    },
    btn4: {
      color: "#AEFFC6",
      sticker: "images/sticker1.png"
    }
  };

  const photoEls = [
    document.getElementById("photo1"),
    document.getElementById("photo2"),
    document.getElementById("photo3")
  ];



  /* === CAMERA === */
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => { video.srcObject = stream; })
    .catch(err => { alert("Kamera tidak dapat diakses"); console.error(err); });

  /* === HELPERS === */
  const storePhoto = (idx, dataURL) => {
    const all = JSON.parse(localStorage.getItem("photobooth_photos") || "{}");
    all[`photo${idx + 1}`] = dataURL;
    localStorage.setItem("photobooth_photos", JSON.stringify(all));
  };

  const startCountdown = sec => new Promise(res => {
    let n = sec;
    countdown.textContent = n;
    countdown.style.display = "flex";
    const iv = setInterval(() => {
      countdown.textContent = --n;
      if (n === 0) { clearInterval(iv); countdown.style.display = "none"; res(); }
    }, 1000);
  });

  const capturePhoto = idx => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();


    const dataURL = canvas.toDataURL("image/png");
    photoEls[idx].style.backgroundImage = `url(${dataURL})`;
    storePhoto(idx, dataURL);
  };

  const takeThree = async () => {
    for (let i = 0; i < 3; i++) {
      await startCountdown(3);
      capturePhoto(i);
    }
  };

  /* === EVENTS === */
  snapBtn.addEventListener("click", e => { e.preventDefault(); takeThree(); });

  resetBtn.addEventListener("click", e => {
    e.preventDefault();
    photoEls.forEach(el => el.style.backgroundImage = "");
    localStorage.removeItem("photobooth_photos");
  });

  // saveBtn.addEventListener("click", e => { e.preventDefault(); })

  const themeColor = "#"
  localStorage.setItem("themeColor", themeColor);

  const themeSticker = ""
  localStorage.setItem("themeSticker", themeSticker);

  Object.entries(themes).forEach(([id, { color, sticker }]) => {
    document.getElementById(id).addEventListener("click", e => {
      e.preventDefault();
      localStorage.setItem("themeColor", color);
      localStorage.setItem("themeSticker", sticker);
    });
  });

});
