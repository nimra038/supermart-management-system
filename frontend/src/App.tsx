import { useEffect, useState } from "react";
import { api } from "./lib/api";

function App() {
  const [message, setMessage] = useState("Checking backend...");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await api.get("/health");
        setMessage(response.data.message);
      } catch {
        setMessage("Backend connection failed");
      }
    };

    checkBackend();
  }, []);

  return (
    <div>
      <h1>Supermart Management System</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;