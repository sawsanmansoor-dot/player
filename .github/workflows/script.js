const player = document.getElementById("player");
const input = document.getElementById("videoInput");
const addBtn = document.getElementById("addBtn");
const playBtn = document.getElementById("playBtn");
const uploadBtn = document.getElementById("uploadBtn");
const playlist = document.getElementById("playlist");
const status = document.getElementById("status");
const loopBtn = document.getElementById("loopBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const nextBtn = document.getElementById("nextBtn");
const muteBtn = document.getElementById("muteBtn");
const pipBtn = document.getElementById("pipBtn");
const fsBtn = document.getElementById("fsBtn");
const nightBtn = document.getElementById("nightBtn");
const clearBtn = document.getElementById("clearBtn");
const speedBtns = document.querySelectorAll(".speed");
const themeBtns = document.querySelectorAll(".theme-buttons button");

const client = new WebTorrent();
let videos = JSON.parse(localStorage.getItem("playlist")) || [];
let currentIndex = 0;

// ------------------- helpers -------------------
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function save() {
  localStorage.setItem("playlist", JSON.stringify(videos));
}

// ------------------- playback -------------------
function playVideo(url) {
  player.src = "";
  status.textContent = "Loading...";
  if (Hls.isSupported() && url.endsWith(".m3u8")) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(player);
    player.play();
    status.textContent = "Streaming HLS video...";
  } else if (url.startsWith("magnet:") || url.endsWith(".torrent")) {
    client.add(url, (torrent) => {
      const file = torrent.files.find(f =>
        f.name.match(/\.(mp4|mkv|webm)$/i)
      );
      if (file) {
        file.renderTo(player);
        status.textContent = "Streaming torrent video...";
      } else {
        status.textContent = "No playable video in torrent!";
      }
    });
  } else {
    player.src = url;
    player.play();
    status.textContent = "Playing direct link...";
  }
  localStorage.setItem("lastIndex", currentIndex);
}

// ------------------- playlist -------------------
function renderPlaylist() {
  playlist.innerHTML = "";
  videos.forEach((v, i) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `
      <img src="${v.thumb || 'https://via.placeholder.com/160x90?text=No+Thumb'}">
      <p>${v.title || 'Untitled'}</p>
    `;
    item.onclick = () => { currentIndex = i; playVideo(v.url); };
    playlist.appendChild(item);
  });
}
renderPlaylist();

// Add video manually
addBtn.onclick = () => {
  const url = input.value.trim();
  if (!url) return alert("Enter a link first!");
  const title = prompt("Video title:", "My Video");
  const thumb = prompt("Thumbnail image URL:", "");
  videos.push({ url, title, thumb });
  save();
  renderPlaylist();
  toast("Added to playlist!");
  input.value = "";
};

// Upload local file
uploadBtn.onclick = () => {
  const f = document.createElement("input");
  f.type = "file";
  f.accept = "video/*";
  f.onchange = e => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      videos.push({ url, title: file.name, thumb: "" });
      save(); renderPlaylist(); toast("Local file added!");
    }
  };
  f.click();
};

// play typed URL
playBtn.onclick = () => {
  const url = input.value.trim();
  if (!url) return alert("Enter a link!");
  playVideo(url);
};

// next video / shuffle
nextBtn.onclick = () => {
  if (videos.length === 0) return;
  currentIndex = shuffleBtn.dataset.on === "1"
    ? Math.floor(Math.random() * videos.length)
    : (currentIndex + 1) % videos.length;
  playVideo(videos[currentIndex].url);
};

// loop / shuffle toggles
loopBtn.onclick = () => {
  player.loop = !player.loop;
  toast(player.loop ? "Loop ON" : "Loop OFF");
};
shuffleBtn.onclick = () => {
  shuffleBtn.dataset.on = shuffleBtn.dataset.on === "1" ? "0" : "1";
  toast(shuffleBtn.dataset.on === "1" ? "Shuffle ON" : "Shuffle OFF");
};

// mute
muteBtn.onclick = () => {
  player.muted = !player.muted;
  toast(player.muted ? "Muted" : "Unmuted");
};

// PiP
pipBtn.onclick = async () => {
  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
  } else if (player.requestPictureInPicture) {
    await player.requestPictureInPicture();
  }
};

// fullscreen
fsBtn.onclick = () => {
  if (player.requestFullscreen) player.requestFullscreen();
};

// night / light
nightBtn.onclick = () => {
  document.body.classList.toggle("night");
  toast(document.body.classList.contains("night") ? "Light Mode" : "Dark Mode");
};

// clear
clearBtn.onclick = () => {
  if (confirm("Clear playlist?")) {
    videos = [];
    save(); renderPlaylist();
  }
};

// theme color change
themeBtns.forEach(btn => {
  btn.onclick = () => {
    document.body.classList.remove("red","blue","gold","purple");
    document.body.classList.add(btn.dataset.color);
    localStorage.setItem("theme", btn.dataset.color);
  };
});

// load last theme / video
const savedTheme = localStorage.getItem("theme");
if (savedTheme) document.body.classList.add(savedTheme);
const last = localStorage.getItem("lastIndex");
if (last && videos[last]) currentIndex = parseInt(last);

// playback speed
speedBtns.forEach(btn => {
  btn.onclick = () => {
    player.playbackRate = parseFloat(btn.dataset.speed);
    toast(`Speed ${btn.dataset.speed}×`);
  };
});

// remember progress
player.addEventListener("timeupdate", () => {
  if (videos[currentIndex])
    videos[currentIndex].pos = player.currentTime;
});
player.addEventListener("loadedmetadata", () => {
  if (videos[currentIndex] && videos[currentIndex].pos)
    player.currentTime = videos[currentIndex].pos;
});

// keyboard shortcuts
document.addEventListener("keydown", e => {
  if (e.code === "Space") player.paused ? player.play() : player.pause();
  if (e.key === "n") nextBtn.click();
  if (e.key === "l") loopBtn.click();
  if (e.key === "m") muteBtn.click();
  if (e.key === "s") shuffleBtn.click();
});
