// import * as AFRAME from "/node_modules/aframe/dist/aframe.min.js"; // Import A-Frame (non-module)
import { initializeApp } from "/node_modules/firebase/app/dist/index.mjs";
import {
  getFirestore,
  collection,
  getDocs,
} from "/node_modules/firebase/firestore/dist/index.mjs";
import {
  getStorage,
  ref,
  getDownloadURL,
} from "/node_modules/firebase/storage/dist/index.mjs";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAXmpwAy7bdxh4JZYx4zOLz0je459WLREk",
  authDomain: "fireye-91940.firebaseapp.com",
  projectId: "fireye-91940",
  storageBucket: "fireye-91940.firebasestorage.app",
  messagingSenderId: "930523613502",
  appId: "1:930523613502:web:95cf7c6757a135453e446f",
  measurementId: "G-1SFE69CPLY",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
document.addEventListener("DOMContentLoaded", () => {
  if (typeof AFRAME === "undefined") {
    console.error("A-Frame is not loaded. Check script order and paths.");
    return;
  }

  const startButton = document.getElementById("startButton");
  if (!startButton) {
    console.error("Start AR Session button not found in DOM");
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const gpsLat = parseFloat(urlParams.get("gpsLat")) || 33.20322;
  const gpsLon = parseFloat(urlParams.get("gpsLon")) || 35.57516;
  const x = parseFloat(urlParams.get("x")) || 0.0;
  const y = parseFloat(urlParams.get("y")) || -4.56;
  const z = parseFloat(urlParams.get("z")) || -3.61;
  const scale = parseFloat(urlParams.get("scale")) || 1.0;
  const objectId = urlParams.get("objectId") || "ARObject1";
  const anchorId = urlParams.get("anchorId") || null;

  if (!gpsLat || !gpsLon) {
    console.error("Invalid GPS coordinates in URL");
    return;
  }

  initializeARSession(
    gpsLat,
    gpsLon,
    x,
    y,
    z,
    scale,
    objectId,
    anchorId,
    startButton
  );
});

async function fetch3DModel(objectId) {
  const storageRef = ref(storage, `models/${objectId}.glb`);
  try {
    const url = await getDownloadURL(storageRef);
    console.log("3D Model URL:", url);
    return url;
  } catch (error) {
    console.error("Error fetching 3D model:", error);
    return null;
  }
}

async function fetchAnchorData(anchorId) {
  const querySnapshot = await getDocs(collection(db, "anchors"));
  let anchorData = null;
  querySnapshot.forEach((doc) => {
    if (doc.id === anchorId) {
      anchorData = doc.data();
    }
  });
  return anchorData;
}

async function initializeARSession(
  gpsLat,
  gpsLon,
  x,
  y,
  z,
  scale,
  objectId,
  anchorId,
  startButton
) {
  const scene = document.querySelector("a-scene");
  const arObject = document.querySelector("#arObject");

  // Show AR scene and hide button when starting
  startButton.style.display = "none";
  scene.style.display = "block";

  // Fetch and load 3D model from Firebase Storage
  const modelUrl = await fetch3DModel(objectId);
  if (modelUrl) {
    arObject.setAttribute("gltf-model", modelUrl);
    arObject.setAttribute("scale", `${scale} ${scale} ${scale}`);
  } else {
    // Fallback to green box if model fails to load
    arObject.setAttribute(
      "geometry",
      "primitive: box; width: 1; height: 1; depth: 1"
    );
    arObject.setAttribute("material", "color: #00ff00");
    arObject.setAttribute("scale", `${scale} ${scale} ${scale}`);
    console.error("Failed to load 3D model, using fallback box");
  }

  // Fetch anchor data from Firestore if anchorId exists
  let finalGpsLat = gpsLat;
  let finalGpsLon = gpsLon;
  let finalX = x;
  let finalY = y;
  let finalZ = z;
  let finalScale = scale;

  if (anchorId) {
    const anchorData = await fetchAnchorData(anchorId);
    if (anchorData) {
      finalGpsLat = anchorData.gpsLat || gpsLat;
      finalGpsLon = anchorData.gpsLon || gpsLon;
      finalX = anchorData.x || x;
      finalY = anchorData.y || y;
      finalZ = anchorData.z || z;
      finalScale = anchorData.scale || scale;
    } else {
      console.warn("Anchor data not found for anchorId:", anchorId);
    }
  }

  // Position based on GPS and anchor data (simplified for testing, refine with WebXR hit-test later)
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;
      positionObjectBasedOnGPS(
        arObject,
        userLat,
        userLon,
        finalGpsLat,
        finalGpsLon,
        finalX,
        finalY,
        finalZ,
        finalScale
      );
    },
    (error) => {
      console.error("Geolocation failed:", error);
      alert(
        "Geolocation is required for AR positioning. Please enable location services."
      );
    }
  );

  // Enable WebXR AR session via A-Frame with better error handling
  if (AFRAME.utils.device.isMobile()) {
    try {
      scene.setAttribute("webxr", "optionalFeatures: hit-test, geolocation");
      await scene.enterAR(); // Use await to handle async AR entry
      console.log("WebXR AR session started successfully");
    } catch (error) {
      console.error("Failed to start WebXR AR session:", error);
      alert(
        "Failed to start AR session. Ensure WebXR is supported, HTTPS is enabled, and location services are allowed."
      );
      // Re-show button if AR fails to allow retry
      startButton.style.display = "block";
      scene.style.display = "none";
    }
  } else {
    console.error("WebXR AR requires a mobile AR-capable device");
    alert(
      "WebXR AR requires a mobile AR-capable device. Please test on Android/iOS with a supported browser."
    );
    // Re-show button if on non-mobile device
    startButton.style.display = "block";
    scene.style.display = "none";
  }
}

function positionObjectBasedOnGPS(
  object,
  userLat,
  userLon,
  targetLat,
  targetLon,
  x,
  y,
  z,
  scale
) {
  // Simplified GPS-based positioning (approximate, refine for AR accuracy)
  const latDiff = targetLat - userLat;
  const lonDiff = targetLon - userLon;
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon); // Use Haversine formula
  object.setAttribute(
    "position",
    `${x + lonDiff * 111000} ${y} ${z + latDiff * 111000}`
  );
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
