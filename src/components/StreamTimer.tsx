'use client';
import { useState, useEffect } from "react";

// Define a Section type
interface Section {
  name: string;
  duration: number;
}

export default function StreamTimer() {
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSection, setCurrentSection] = useState<number | null>(null);
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [newSectionName, setNewSectionName] = useState<string>("");
  const [newSectionDuration, setNewSectionDuration] = useState<string>("");

  // Load sections from localStorage on mount
  useEffect(() => {
    const savedSections = localStorage.getItem("streamSections");
    if (savedSections) {
      setSections(JSON.parse(savedSections));
    }
  }, []);

  // Save sections to localStorage whenever they change
  useEffect(() => {
    if (sections.length > 0) {
      localStorage.setItem("streamSections", JSON.stringify(sections));
    }
  }, [sections]);

  // Timer logic
  useEffect(() => {
    if (!isRunning || currentSection === null) return;

    const timer = setInterval(() => {
      setTime((prevTime) => {
        const section = sections[currentSection];
        if (prevTime + 1 >= section.duration * 60) {
          // Section finished
          if (currentSection < sections.length - 1) {
            setCurrentSection((prevSection) => prevSection !== null ? prevSection + 1 : 0);
            return 0;
          } else {
            setIsRunning(false);
            return section.duration * 60; // Clamp to max
          }
        }
        return prevTime + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, currentSection, sections]);

  // Add new section
  const addSection = () => {
    if (newSectionName && newSectionDuration) {
      setSections([
        ...sections,
        { name: newSectionName, duration: parseInt(newSectionDuration) },
      ]);
      setNewSectionName("");
      setNewSectionDuration("");
    }
  };

  // Start timer
  const startTimer = () => {
    if (sections.length > 0 && currentSection === null) {
      setCurrentSection(0);
      setTime(0);
      setIsRunning(true);
    } else if (currentSection !== null) {
      setIsRunning(true);
    }
  };

  // Pause timer
  const pauseTimer = () => setIsRunning(false);

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setCurrentSection(null);
    setTime(0);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-800 text-white rounded-lg shadow-lg">
      {/* Section Management */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Manage Sections</h2>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="Section Name"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            className="p-2 rounded bg-gray-700 text-white"
          />
          <input
            type="number"
            placeholder="Duration (min)"
            value={newSectionDuration}
            onChange={(e) => setNewSectionDuration(e.target.value)}
            className="p-2 rounded bg-gray-700 text-white w-24"
          />
          <button
            onClick={addSection}
            className="p-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <ul className="space-y-2">
          {sections.map((section, index) => (
            <li
              key={index}
              className="flex justify-between bg-gray-700 p-2 rounded"
            >
              <span>
                {section.name} ({section.duration} min)
              </span>
              <button
                onClick={() =>
                  setSections(sections.filter((_, i) => i !== index))
                }
                className="text-red-400 hover:text-red-500"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Timer Display */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Live Timer</h2>
        <div className="text-4xl font-mono mb-4">
          {currentSection !== null
            ? `${sections[currentSection].name}: ${formatTime(
                time
              )} / ${formatTime(sections[currentSection].duration * 60)}`
            : "No Section Selected"}
        </div>
        <div className="relative h-4 bg-gray-600 rounded">
          {currentSection !== null && (
            <div
              className="absolute h-4 bg-blue-600 rounded"
              style={{
                width: `${
                  (time / (sections[currentSection].duration * 60)) * 100
                }%`,
              }}
            />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex space-x-2">
        <button
          onClick={startTimer}
          className="p-2 bg-green-600 rounded hover:bg-green-700"
          disabled={isRunning || sections.length === 0}
        >
          Start
        </button>
        <button
          onClick={pauseTimer}
          className="p-2 bg-yellow-600 rounded hover:bg-yellow-700"
          disabled={!isRunning}
        >
          Pause
        </button>
        <button
          onClick={resetTimer}
          className="p-2 bg-red-600 rounded hover:bg-red-700"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
