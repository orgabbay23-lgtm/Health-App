import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "sonner";
import { AuthProvider } from "./components/AuthProvider.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
        <Toaster dir="rtl" position="top-center" richColors />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
