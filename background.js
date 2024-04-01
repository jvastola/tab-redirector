// Map to store URLs and their corresponding tab IDs
const urlTabMap = new Map();

// Helper function to get the base URL without parameters or fragments
function getBaseUrl(url) {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
}

// Listen for new tab creation events
chrome.tabs.onCreated.addListener(async (tab) => {
  console.log('New tab created:', tab.url);

  const baseUrl = getBaseUrl(tab.pendingUrl || tab.url);
  console.log('Base URL:', baseUrl);

  // Check if a tab with the same base URL is already open
  for (const [tabUrl, tabId] of urlTabMap.entries()) {
    const existingBaseUrl = getBaseUrl(tabUrl);
    console.log('Existing tab URL:', tabUrl, 'Base URL:', existingBaseUrl);

    if (existingBaseUrl === baseUrl) {
      console.log('Matching tab found, navigating to existing tab:', tabId);
      // Navigate to the existing tab
      chrome.tabs.update(tabId, { active: true });
      chrome.tabs.remove(tab.id);
      return;
    }
  }

  console.log('No matching tab found, adding new tab to map');
  // Add the new tab to the map
  urlTabMap.set(tab.url, tab.id);
  console.log('Current map:', urlTabMap);
});

// Listen for URL changes within existing tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    console.log('URL changed for tab:', tabId, 'New URL:', changeInfo.url);

    const baseUrl = getBaseUrl(changeInfo.url);
    console.log('Base URL:', baseUrl);

    // Check if a tab with the same base URL is already open
    for (const [tabUrl, id] of urlTabMap.entries()) {
      if (id === tabId) {
        console.log('Updating URL in map for current tab');
        // Update the URL in the map
        urlTabMap.delete(tabUrl);
        urlTabMap.set(changeInfo.url, tabId);
        console.log('Current map:', urlTabMap);
        break;
      } else {
        const existingBaseUrl = getBaseUrl(tabUrl);
        console.log('Existing tab URL:', tabUrl, 'Base URL:', existingBaseUrl);

        if (existingBaseUrl === baseUrl) {
          console.log('Matching tab found, navigating to existing tab:', id);
          // Navigate to the existing tab
          chrome.tabs.update(id, { active: true });
          chrome.tabs.remove(tabId);
          return;
        }
      }
    }
  }
});

// Clean up the map when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  console.log('Tab closed:', tabId);

  for (const [url, id] of urlTabMap.entries()) {
    if (id === tabId) {
      console.log('Removing closed tab from map:', url);
      urlTabMap.delete(url);
      console.log('Current map:', urlTabMap);
      break;
    }
  }
});