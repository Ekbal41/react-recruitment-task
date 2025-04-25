import "./App.css";
import { useState, useEffect, useRef } from "react";

const baseUrl = "https://sugarytestapi.azurewebsites.net/";
const listPath = "TestApi/GetComplains";
const savePath = "TestApi/SaveComplain";

function App() {
  const [complains, setComplains] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch complaints from the API
  const fetchComplains = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseUrl}${listPath}`, { signal });
      const data = await response.json();
      setComplains(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // fetch aborted — silently ignore
        return;
      }
      console.error("Error fetching complaints:", err);
      setErrorMessage("Failed to load complaints");
    } finally {
      setIsLoading(false);
    }
  };

  // Save a new complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const formValues = Object.fromEntries(formData.entries());
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsSaving(true);
      const response = await fetch(`${baseUrl}${savePath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!data.Success) throw new Error("Failed to save complaint.");
      fetchComplains();
      form.reset();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      let message: string;
      if (e instanceof Error) {
        message = e.message;
      } else {
        message = "An unexpected error occurred";
      }
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchComplains(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="wrapper">
      <h2>Submit a Complaint</h2>
      <div>
        {isSaving || isLoading ? <GoogleStyleLoader /> : null}

        <form className="complain-form" onSubmit={handleSubmit}>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <div className="complaint-form">
            <label htmlFor="complaint-title" className="sr-only">
              Complaint Title
            </label>
            <input
              id="complaint-title"
              type="text"
              placeholder="Complaint title here..."
              aria-required="true"
              aria-label="Complaint title"
              title="Complaint title here"
              name="title"
              required
            />

            <label htmlFor="complaint-body" className="sr-only">
              Complaint Details
            </label>
            <textarea
              id="complaint-body"
              placeholder="Enter your complaint here..."
              rows={5}
              aria-required="true"
              aria-label="Complaint details"
              name="body"
              required
            />
          </div>

          <button className="btn btn-primary w-full" type="submit">
            {isSaving ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
      </div>

      <h2>Complaints List</h2>
      {isLoading ? (
        <p className="text-center">Loading all complains...</p>
      ) : complains.length > 0 ? (
        complains.map((complain: ComplainType) =>
          complain.Title ? (
            <div key={complain.Id} className="complain-item">
              <h3 className="text-start">{complain.Title}</h3>
              <p className="text-start">{complain.Body}</p>
            </div>
          ) : (
            <div key={complain.Id || Math.random()} className="complain-item">
              <p className="text-start">--</p>
            </div>
          )
        )
      ) : (
        <p>No complaints available.</p>
      )}
    </div>
  );
}

export default App;

type ComplainType = {
  Id: string;
  Title?: string;
  Body?: string;
};

const GoogleStyleLoader = () => {
  return (
    <div className="loader-container">
      <div className="loader-bar" />
    </div>
  );
};
