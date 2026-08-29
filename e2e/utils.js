const { element, by, device } = require('detox');

async function waitForElementToBeVisible(elementId, timeout = 5000) {
  await device.waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout);
}

async function tapElement(elementId) {
  await element(by.id(elementId)).tap();
}

function getPlatform() {
  return device.getPlatform();
}

module.exports = {
  waitForElementToBeVisible,
  tapElement,
  getPlatform,
};
