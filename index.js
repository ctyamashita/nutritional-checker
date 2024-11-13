// Camera Settings
let localStream;
const video = document.querySelector('video');
const canvas = document.querySelector('canvas');
const photo = document.getElementById('photoTaken');
const startCameraBtn = document.getElementById('startCameraBtn');
const takePhotoBtn = document.getElementById("takePhotoBtn");
const searchBtn = document.getElementById('searchBtn');
const barcodeInput = document.getElementById("barcode");

function stopTracks(stream) {
  const tracks = stream.getTracks();
  tracks.forEach(track => track.stop());
}

// Capture interface
startCameraBtn.addEventListener('click', async function() {
  startCapture();
  startCameraBtn.classList.add('hide');
  takePhotoBtn.classList.remove('hide');
});

function startCapture() {
  stop(); // close before play
  video.classList.add('active');
  const constraints = {
    video: {facingMode: "environment"},
    audio: false
  }

  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    localStream = stream;
    // Attach local stream to video element      
    video.srcObject = stream;
  }).catch(function(err) {
    console.error('getUserMediaError', err, err.stack);
  });
}

function stop() {
  try{
    if (localStream) stopTracks(localStream);
    startCameraBtn.classList.remove('hide')
    takePhotoBtn.classList.add('hide')
  } catch (e){
    alert(e.message);
  }
};

takePhotoBtn.addEventListener('click', async (event) => {
  let src;
  src = captureFrame();
  document.getElementById("photoTaken").src = src;
});

function captureFrame(){
  let w = video.videoWidth;
  let h = video.videoHeight;
  canvas.width  = w;
  canvas.height = h;
  let ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);
  video.classList.remove('active');
  stop();
  return canvas.toDataURL("image/jpeg")
}

photo.onload = () => readBarcode();

searchBtn.addEventListener('click', (e) => {
  const barcode = document.getElementById("barcode").value;
  if (isValid()) {
    searchBtn.removeAttribute('disabled')
  } else {
    searchBtn.setAttribute('disabled','')
  }

  document.getElementById("result-img").innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'
  searchProduct(barcode);
})

barcodeInput.addEventListener('input', ()=>{
  if (isValid()) {
    searchBtn.removeAttribute('disabled')
  } else {
    searchBtn.setAttribute('disabled','')
  }
})

function isValid() {
  const input = document.getElementById("barcode").value;
  return (input.length >= 8 && !isNaN(input))
}

function searchProduct(barcode) {
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
  fetch(url)
    .then(response=>response.json())
    .then(data => {
      if (data.status_verbose == 'product found') {
        console.log(data.product.nutriments)
        const nutritionsHeaders = Object.keys(data.product.nutriments).filter(key => (!/[_-]/.test(key) && key !== 'energy'));
        const nutritionTable = nutritionsHeaders.map(header=>{
          return `<tr>
                    <th>${header}</th>  
                    <td>${data.product.nutriments[`${header}_100g`]}${data.product.nutriments[`${header}_unit`]}</td>
                  </tr>`
        })

        document.getElementById("result-img").innerHTML = `<img src="${data.product.image_url}"/>`

        document.getElementById('nutrition-table').innerHTML = `<tr>
                                                                  <th>calories</th>
                                                                  <td>${data.product.nutriments['energy-kcal_100g']}${data.product.nutriments['energy-kcal_unit']}</td>
                                                                </tr>
                                                                ${nutritionTable.join('\n')}`
        document.getElementById('info-content').insertAdjacentHTML('beforeend', `<a href="https://www.barcodelookup.com/${barcode}">+info</a>`)
      }
    })
}

function readBarcode() {
  // create new detector
  const barcodeDetector = new BarcodeDetector({
    formats: ["code_39", "codabar", "ean_13"],
  });
  
  if (barcodeDetector) {
    barcodeDetector
    .detect(photo)
    .then((barcodes) => {
      const barCode = barcodes[0]?.rawValue || 'No barcode detected'
      document.getElementById("barcode").value = barCode;
    })
    .catch((err) => {
      console.log(err);
    });
  } else {
    console.log('Barcode detector not supported')
  }
}