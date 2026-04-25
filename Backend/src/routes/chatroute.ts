import { Request, Response, Router } from "express";
// import { requireAuth } from "../middleware/auth.js"; // Uncomment if using auth middleware

interface ChatRequestBody {
  message: string;
}

interface PythonAIResponse {
  message: string;
}

const router = Router();

router.post("/chat", async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
  const { message } = req.body;
  const token = req.headers.authorization;

  console.log("================================");
  console.log("🤖 Forwarding request to Python AI Agent...");
  console.log("User Message:", message);
  console.log("================================");

  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8003";
    // URL of your Python server (make sure the port matches your Python app)
    const PYTHON_AGENT_URL = `${aiServiceUrl}/chat-reply`; 

    // Send the data to the Python backend
    const pythonResponse = await fetch(PYTHON_AGENT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward the token in case Python needs to know which user is asking
        "Authorization": token || "", 
      },
      body: JSON.stringify({ message }),
    });

    // Check if the Python server threw an error (e.g., 500 or 404)
    if (!pythonResponse.ok) {
      throw new Error(`Python API responded with status ${pythonResponse.status}`);
    }

    // Parse the JSON reply from Python
    const aiData = await pythonResponse.json() as PythonAIResponse;

    // Send the AI's reply back to the React frontend
    return res.status(200).json({ 
      reply: aiData.message
    });

  } catch (error) {
    console.error("❌ Error communicating with Python:", error);
    
    // Send a graceful fallback message to the frontend if Python is down
    return res.status(500).json({ 
      reply: "Sorry, my AI brain (Python) is currently disconnected or offline." 
    });
  }
});

export default router;