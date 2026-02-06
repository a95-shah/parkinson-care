
const apiKey = "AIzaSyBp_PvUWk3aM2mQIDE-UOvdYXRGqN2Q1T0";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
const fs = require('fs');

async function checkModels() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    fs.writeFileSync('models.json', JSON.stringify(data, null, 2));
    console.log("Written to models.json");
  } catch (error) {
    console.error("Error fetching models:", error);
    fs.writeFileSync('models_error.txt', error.toString());
  }
}

checkModels();
