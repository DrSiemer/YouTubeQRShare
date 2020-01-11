document.addEventListener('DOMContentLoaded', function() {

  let position_input = document.getElementById('button_position');

  let buttonPosition;
  chrome.storage.sync.get('qrSharePosition', function(data) {
    buttonPosition = data.qrSharePosition;
    if (data.qrSharePosition == undefined) {
      buttonPosition = 2;
      chrome.storage.sync.set({ qrSharePosition: 2 });
    }
    position_input.value = buttonPosition;
  });

  position_input.addEventListener('change', (event) => {
    chrome.storage.sync.set({ qrSharePosition: event.target.value });
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'moveButton'});
    });
  });

}, false);