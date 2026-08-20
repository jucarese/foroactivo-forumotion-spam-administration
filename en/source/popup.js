"use strict";

const button = document.getElementById("open");
const status = document.getElementById("status");

button.addEventListener("click", async () => {
  status.textContent = "";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/^https?:\/\//i.test(tab.url || "")) {
      throw new Error("Open a forum page first.");
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["purge-engine.js"]
    });
    window.close();
  } catch (error) {
    status.textContent = error.message || "The tool could not be opened.";
  }
});

