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

      // create a new AudioContext and connect the audio element
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
      } catch (error) {
        console.error("Error creating MediaElementSource:", error);
        return;
      }

      // only create and connect analyser once
      if (!analyser) {
        analyser = audioCtx.createAnalyser();
        audioSource.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 64; // lower value for chunkier bars
      }
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const barWidth = canvas.width / bufferLength;
      let barHeight;
      let x = 0;

      // animate frequency bars
      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        analyser.getByteFrequencyData(dataArray);
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];
          const r = (i * barHeight) / 20;
          const g = i * 4;
          const b = barHeight / 2;
          ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
          ctx.fillRect(
            x,
            canvas.height - barHeight / 2,
            barWidth,
            barHeight / 2
          );
          x += barWidth + 1; // add a small gap between bars
        }
        requestAnimationFrame(animate);
      }
      animate();
    });
  }
});
