import { chromium } from 'playwright';

/**
 * Launch Chromium locally or connect to a remote sidecar via CDP.
 * @param {object} options - Launch options passed to chromium.launch()
 * @returns {Promise<import('playwright').Browser>}
 */
export async function launchBrowser(options = {}) {
  const wsEndpoint = process.env.BROWSER_WS_ENDPOINT;
  if (wsEndpoint) {
    const endpoint = wsEndpoint.endsWith('/chrome') ? wsEndpoint : `${wsEndpoint}/chrome`;
    return await chromium.connectOverCDP({ endpointURL: endpoint });
  }
  return await chromium.launch(options);
}
