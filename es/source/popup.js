"use strict";

const button = document.getElementById("open");
const status = document.getElementById("status");

button.addEventListener("click", async () => {
  status.textContent = "";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/^https?:\/\//i.test(tab.url || "")) {
      throw new Error("Abre primero una página del foro.");
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["purge-engine.js"]
    });
    window.close();
  } catch (error) {
    status.textContent = error.message || "No se pudo abrir la herramienta.";
  }
});
