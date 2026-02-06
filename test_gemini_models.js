
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const apiKey = "AIzaSyBp_PvUWk3aM2mQIDE-UOvdYXRGqN2Q1T0";
const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-2.0-flash-exp",
    "gemini-pro",
    "gemini-1.0-pro"
  ];

  let output = "Testing models:\n";

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hello");
      await result.response;
      output += `SUCCESS: ${modelName}\n`;
    } catch (error) {
      output += `FAILED: ${modelName} - ${error.message.split('\n')[0]}\n`;
    }
  }

  fs.writeFileSync('model_test_output.txt', output);
}

testModels();
