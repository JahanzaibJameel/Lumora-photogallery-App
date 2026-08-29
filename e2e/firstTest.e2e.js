const { device, element, by } = require('detox');

describe('Lumora E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('App Launch', () => {
    it('should show Albums screen header on launch', async () => {
      await expect(element(by.text('Albums'))).toBeVisible();
    });

    it('should show empty state when no albums are available', async () => {
      await expect(element(by.text('No Albums Found'))).toBeVisible();
    });
  });

  describe('Navigation', () => {
    it('should navigate to Widgets screen', async () => {
      await element(by.accessibilityId('Open widgets')).tap();
      await expect(element(by.text('Widgets'))).toBeVisible();
    });

    it('should navigate back to Albums from Widgets', async () => {
      await element(by.accessibilityId('Open widgets')).tap();
      await expect(element(by.text('Widgets'))).toBeVisible();

      await element(by.accessibilityId('Go back')).tap();
      await expect(element(by.text('Albums'))).toBeVisible();
    });

    it('should toggle search bar in Albums header', async () => {
      await element(by.accessibilityId('Open search')).tap();
      await expect(element(by.accessibilityId('Search photos'))).toBeVisible();

      await element(by.accessibilityId('Close search')).tap();
      await expect(element(by.text('Albums'))).toBeVisible();
    });
  });

  describe('Albums Screen Interactions', () => {
    it('should display refresh FAB when albums list is empty', async () => {
      await expect(element(by.accessibilityId('Refresh albums'))).toBeVisible();
    });
  });
});
