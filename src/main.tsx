import React from "react"

import ReactDOM from "react-dom/client"

import App from "./App"

import "./index.css"

// Glassmorphism: import CUỐI CÙNG để ghi đè nền/viền/đổ bóng của các class Tailwind
import "./glass-theme.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
