document.addEventListener("DOMContentLoaded", () => {
  const video     = document.getElementById("videoElement");
  const canvas    = document.getElementById("canvas");
  const ctx       = canvas.getContext("2d");
  const countdown = document.getElementById("countdown");

  const snapBtn  = document.getElementById("snap");
  const resetBtn = document.getElementById("reset");

  const photoEls = [
    document.getElementById("photo1"),
    document.getElementById("photo2"),
    document.getElementById("photo3")
  ];

  /* === CAMERA === */
  navigator.mediaDevices.getUserMedia({ video:true })
    .then(stream => { video.srcObject = stream; })
    .catch(err   => { alert("Kamera tidak dapat diakses"); console.error(err); });

  /* === HELPERS === */
  const storePhoto = (idx, dataURL)=>{
    const all = JSON.parse(localStorage.getItem("photobooth_photos")||"{}");
    all[`photo${idx+1}`] = dataURL;
    localStorage.setItem("photobooth_photos", JSON.stringify(all));
  };

  const startCountdown = sec => new Promise(res=>{
    let n=sec;
    countdown.textContent=n;
    countdown.style.display="flex";
    const iv=setInterval(()=>{
      countdown.textContent=--n;
      if(n===0){ clearInterval(iv); countdown.style.display="none"; res(); }
    },1000);
  });

  const capturePhoto = idx =>{
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    ctx.translate(canvas.width,0);
    ctx.scale(-1,1);
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    ctx.restore();

    const dataURL = canvas.toDataURL("image/png");
    photoEls[idx].style.backgroundImage=`url(${dataURL})`;
    storePhoto(idx,dataURL);
  };

  const takeThree = async()=>{
    for(let i=0;i<3;i++){
      await startCountdown(3);
      capturePhoto(i);
    }
  };

  /* === EVENTS === */
  snapBtn.addEventListener("click",e=>{ e.preventDefault(); takeThree(); });

  resetBtn.addEventListener("click",e=>{
    e.preventDefault();
    photoEls.forEach(el=>el.style.backgroundImage="");
    localStorage.removeItem("photobooth_photos");
  });
});
