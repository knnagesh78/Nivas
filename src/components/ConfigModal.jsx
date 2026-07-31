import React, { useState } from "react";
import { saveFirebaseConfig } from "../firebase";

export default function ConfigModal() {
  const [configType, setConfigType] = useState("paste"); // "paste" or "manual"
  const [jsonConfig, setJsonConfig] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    let finalConfig = {};

    if (configType === "paste") {
      try {
        // Try parsing as JSON or javascript object
        let cleanJson = jsonConfig.trim();
        // Remove 'const firebaseConfig = ' or 'var config = ' if present
        cleanJson = cleanJson.replace(/^(const|let|var)\s+\w+\s*=\s*/i, "");
        // Remove trailing semicolon
        cleanJson = cleanJson.replace(/;\s*$/, "");
        // Try parsing
        // If it's a JS object declaration and not strict JSON, we can parse it roughly
        // Let's replace key names without quotes to quoted key names, etc.
        // A safer way is to use a Function evaluation or JSON.parse
        // We'll try JSON.parse first, if not, we use regex parsing.
        try {
          // Try JSON parse
          finalConfig = JSON.parse(cleanJson);
        } catch {
          // Regex parse for JS object format
          const extractField = (field) => {
            const regex = new RegExp(`${field}\\s*:\\s*["'\`]([^"'\`]+)["'\`]`, "i");
            const match = cleanJson.match(regex);
            return match ? match[1] : "";
          };
          
          finalConfig = {
            apiKey: extractField("apiKey"),
            authDomain: extractField("authDomain"),
            projectId: extractField("projectId"),
            storageBucket: extractField("storageBucket"),
            messagingSenderId: extractField("messagingSenderId"),
            appId: extractField("appId"),
          };
        }
      } catch (err) {
        setError("Failed to parse the configuration. Please check the format or use manual input.");
        return;
      }
    } else {
      finalConfig = {
        apiKey: apiKey.trim(),
        authDomain: authDomain.trim(),
        projectId: projectId.trim(),
        storageBucket: storageBucket.trim(),
        messagingSenderId: messagingSenderId.trim(),
        appId: appId.trim(),
      };
    }

    if (!finalConfig.apiKey || !finalConfig.projectId) {
      setError("At least API Key and Project ID are required.");
      return;
    }

    const success = saveFirebaseConfig(finalConfig);
    if (!success) {
      setError("Invalid configuration. Please check your credentials.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        <div className="bg-slate-800 p-6 text-white">
          <h2 className="text-2xl font-bold tracking-tight">Configure Firebase</h2>
          <p className="mt-1 text-sm text-slate-300">
            Let's connect this Hostel Management App to your Firebase project.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex rounded-md bg-slate-100 p-1">
            <button
              type="button"
              className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-all ${
                configType === "paste"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-950"
              }`}
              onClick={() => setConfigType("paste")}
            >
              Paste Config Object
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-all ${
                configType === "manual"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-950"
              }`}
              onClick={() => setConfigType("manual")}
            >
              Enter Manually
            </button>
          </div>

          {configType === "paste" ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Firebase Web Config Snippet
              </label>
              <textarea
                required
                rows={8}
                className="w-full rounded-lg border border-slate-300 p-3 font-mono text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder={`const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234:web:abcd"
};`}
                value={jsonConfig}
                onChange={(e) => setJsonConfig(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Paste the configuration object from your Firebase console web app settings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase">API Key</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Project ID</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Auth Domain</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">Storage Bucket</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase">App ID</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 py-3 text-center text-sm font-semibold text-white shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
            >
              Save & Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
