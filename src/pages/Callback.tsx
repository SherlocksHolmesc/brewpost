// pages/Callback.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Callback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Finishing login…");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    if (!code) {
      setStatus("No code found. Redirecting to home...");
      setTimeout(() => navigate("/"), 2000);
      return;
    }

    const exchangeToken = async () => {
      try {
        const res = await fetch(`/api/auth/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
          credentials: "include",
        });

        if (res.ok) {
          setStatus("Login successful! Redirecting...");
          navigate("/app");
        } else {
          setStatus("Login failed. Please try again.");
        }
      } catch (err) {
        console.error(err);
        setStatus("Error during login.");
      }
    };

    exchangeToken();
  }, [location, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>{status}</h1>
    </div>
  );
}
