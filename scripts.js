document.addEventListener("DOMContentLoaded", function () {
  // dynamically size the canvas to match its container for responsive visualization
  const vContainer = document.getElementById("vContainer");
  const canvas = document.getElementById("canvas1");
  let audioCtx = null;
  let audioSource = null;
  let analyser = null;

  if (vContainer && canvas) {
    canvas.width = vContainer.clientWidth;
    canvas.height = vContainer.clientHeight;

    const ctx = canvas.getContext("2d");

    // on click, start audio playback and visualization (required by browser policy)
    vContainer.addEventListener("click", function () {
      const audioInput = document.getElementById("audioInput");
      const audioPlayer = document.getElementById("audioPlayer");
      let audioURL = null;

      // play the selected audio file and display the player
      const file = audioInput.files[0];
      if (file) {
        if (audioURL) URL.revokeObjectURL(audioURL); // free memory if user reuploads
        audioURL = URL.createObjectURL(file);
        console.log("Audio URL created:", audioURL);
        audioPlayer.src = audioURL;
        audioPlayer.style.display = "block";
        audioPlayer.play();
      } else {
        alert("Please select an audio file first.");
        return;
      }

      // only create AudioContext, MediaElementSource, and AnalyserNode once
      try {
        if (!audioCtx) {
          audioCtx = new AudioContext();
          console.log("AudioContext created");
        }
        if (!audioSource) {
          audioSource = audioCtx.createMediaElementSource(audioPlayer);
        } else if (!audioCtx || audioCtx.state === "closed") {
          audioCtx.resume().then(() => {
            console.log("AudioContext resumed");
          });
        }
        if (!analyser) {
          analyser = audioCtx.createAnalyser();
          audioSource.connect(analyser);
          analyser.connect(audioCtx.destination);
          analyser.fftSize = 128; // lower value for chunkier bars
        }
      } catch (error) {
        console.error("Error creating MediaElementSource:", error);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const barWidth = canvas.width / 2 / bufferLength;

      // animate frequency bars
      function animate() {
        barAnimation(ctx, canvas, analyser, dataArray, bufferLength, barWidth);
        // TODO : other animations can be added here which users can change thru radio buttons?
        requestAnimationFrame(animate);
      }
      animate();
    });
  }

  function barAnimation(
    ctx,
    canvas,
    analyser,
    dataArray,
    bufferLength,
    barWidth
  ) {
    // render a symmetrical audio frequency bar visualization from the center outwards
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    analyser.getByteFrequencyData(dataArray);
    const centerX = canvas.width / 2;
    const gap = 1;
    let barHeight;

    // Left bars: mirror frequency data from center to left
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];
      const r = i * (barHeight / 20);
      const g = i * 4;
      const b = barHeight / 2;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(
        centerX - (i + 1) * (barWidth + gap),
        canvas.height - barHeight / 2,
        barWidth,
        barHeight / 2
      );
    }

    // Right bars: mirror frequency data from center to right
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];
      const r = i * (barHeight / 20);
      const g = i * 4;
      const b = barHeight / 2;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(
        centerX + i * (barWidth + gap),
        canvas.height - barHeight / 2,
        barWidth,
        barHeight / 2
      );
    }
  }
});
