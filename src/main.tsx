import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexProvider } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import App from "./App";
import DeploymentPreview from "./DeploymentPreview";
import { convexClient } from "./convexClient";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root")!);
const client = convexClient;

root.render(
  <React.StrictMode>
    {client ? (
      <ConvexProvider client={client}>
        <ConvexAuthProvider client={client}>
          <App />
        </ConvexAuthProvider>
      </ConvexProvider>
    ) : (
      <DeploymentPreview />
    )}
  </React.StrictMode>,
);
