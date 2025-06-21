// Custom OneSignal Updater Service Worker for GitHub Pages subdirectory deployment
const isGitHubPages = self.location.hostname.includes("github.io")
const repoName = "naderos"
const basePath = isGitHubPages ? `/${repoName}` : ""

// Import the OneSignal updater service worker with correct base path handling
if (isGitHubPages) {
  // For GitHub Pages, we need to handle the subdirectory path
  self.addEventListener("install", (event) => {
    console.log("OneSignal Updater Service Worker installing for GitHub Pages...")
  })

  self.addEventListener("activate", (event) => {
    console.log("OneSignal Updater Service Worker activated for GitHub Pages...")
  })
}

// Import the actual OneSignal updater service worker
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDKUpdaterWorker.js")
