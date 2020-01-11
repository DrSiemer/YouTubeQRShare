let fLogLevel = 1;

function fLog(message, level = 1) {
  if (level <= fLogLevel) {
    console.log('%c'+message, 'color: #105998');
  }
}

function generateQr(qrButton) {
  fLog('Generating QR code', 3);
  let buttonWrapper = qrButton.closest('ytd-unified-share-panel-renderer');
  buttonWrapper.blur();
  let qrCode = document.getElementById('qrcode');
  if (qrCode != null) {
  	qrCode.remove();
  	let modal = document.querySelector('paper-dialog');
  	modal.style.top = (parseInt(modal.style.top)+140)+"px";
  } else {
	  let qrCodeDiv = document.createElement("div"); qrCodeDiv.id = 'qrcode';
	  new QRCode(qrCodeDiv, window.location.href);
		let insertAfter = qrButton.closest('.ytd-unified-share-panel-renderer').querySelector('#copy-link');
		insertAfter.parentNode.insertBefore(qrCodeDiv, insertAfter.nextSibling);
	  qrCodeDiv.classList.add('visible');
	  let modal = document.querySelector('paper-dialog');
  	modal.style.top = (parseInt(modal.style.top)-140)+"px";
	}
}

function activateScript() {
  let attempts = 30;
  let maxButtons = 13;
  var checkForShareButton = setInterval(function(){
    if (document.querySelectorAll('#button[aria-label="Share"]').length) {
      clearInterval(checkForShareButton);
      let shareButton = document.querySelectorAll('#button[aria-label="Share"]')[0].closest('.ytd-menu-renderer');
      if (!shareButton.classList.contains('qr-added')) {
        fLog('Share button found, adding QR button', 3);
        shareButton.classList.add('qr-added');
        shareButton.addEventListener('click', function(){
          let attempts = 10;
          var checkForPopup = setInterval(function(){
            if (document.querySelectorAll('div#contents.style-scope.yt-third-party-share-target-section-renderer').length) {
              clearInterval(checkForPopup);
              let qrCode = document.getElementById('qrcode'); if (qrCode != null) { qrCode.remove(); }
              let buttonPosition;
              chrome.storage.sync.get('qrSharePosition', function(data) {
                let shareButtons = document.querySelector('div#contents.style-scope.yt-third-party-share-target-section-renderer');
                maxButtons = shareButtons.childElementCount + 1;
                buttonPosition = data.qrSharePosition;
                if (data.qrSharePosition == undefined) { buttonPosition = 2; chrome.storage.sync.set({ qrSharePosition: 2 }); }
                if (buttonPosition > maxButtons) { buttonPosition = maxButtons; }
                let qrButton = document.createElement('div'); qrButton.id = 'qrbutton';
                qrButton.innerHTML = '<div class="icon"><img src="'+chrome.runtime.getURL('qr.svg')+'"></div><div id="title" class="style-scope yt-share-target-renderer">QR code</div>';
                qrButton.addEventListener('click', function(){ generateQr(this); });
                if (buttonPosition != maxButtons) {
                  shareButtons.insertBefore(qrButton, shareButtons.childNodes[buttonPosition-1]);
                } else {
                  shareButtons.appendChild(qrButton);
                }
              });
            } else {
              fLog('Searching..', 3);
              attempts--;
              if (attempts == 0) {
                fLog('Share icons not found, giving up :(', 2);
                clearInterval(checkForPopup);
              }
            }
          }, 250);
        });
      } else {
        fLog('Share button found, QR button already added', 3);
      }
    } else {
      fLog('Searching...', 3);
      attempts--;
      if (attempts == 0) {
        fLog('Share button not found, giving up :(', 2);
        clearInterval(checkForShareButton);
      }
    }
  }, 250);

  chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    if (msg.action == 'moveButton') {
      let qrButton = document.getElementById('qrbutton');
      if (qrButton != null) {
        let buttonPosition;
        let qrButtonElement = qrButton.parentNode.removeChild(qrButton);
        chrome.storage.sync.get('qrSharePosition', function(data) {
          buttonPosition = data.qrSharePosition;
          if (buttonPosition > maxButtons) { buttonPosition = maxButtons; }
          let shareButtons = document.querySelector('div#contents.style-scope.yt-third-party-share-target-section-renderer');
          if (buttonPosition != maxButtons) {
            shareButtons.insertBefore(qrButton, shareButtons.childNodes[buttonPosition-1]);
          } else {
            shareButtons.appendChild(qrButton);
          }
        });
      }
    }
  });
}

// Unfortunately we have to continuously check for Url changes
// because YouTube uses an odd method (pushstate?) to swap the url without actually refreshing, which is hard to detect
function detectUrlChange() {
  currentUrl = window.location.href
  if (currentUrl !== savedUrl){
    fLog('> Url changed to '+currentUrl, 3);
    if (currentUrl.indexOf('youtube.com/watch?') !== -1) {
      activateScript();
    }
    savedUrl = currentUrl;
  }
}

let savedUrl = currentUrl = window.location.href;
let urlChangeHandler = setInterval(detectUrlChange, 500);

fLog('QR script loaded', 3);
if (currentUrl.indexOf('youtube.com/watch?') !== -1) { activateScript(); }