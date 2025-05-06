'use client';
import { useState, useEffect } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Dispatch, SetStateAction } from 'react';

// Define a Section type
interface Section {
  name: string;
  duration: number;
}

// Sortable item component for sections
interface SortableSectionItemProps {
  id: string;
  index: number;
  section: Section;
  is_editing: boolean;
  on_edit: () => void;
  on_delete: () => void;
  on_move_up: () => void;
  on_move_down: () => void;
  on_save: () => void;
  on_cancel: () => void;
  edit_name: string;
  edit_duration: string;
  set_edit_name: Dispatch<SetStateAction<string>>;
  set_edit_duration: Dispatch<SetStateAction<string>>;
  is_first: boolean;
  is_last: boolean;
}

function SortableSectionItem({ id, index, section, is_editing, on_edit, on_delete, on_move_up, on_move_down, on_save, on_cancel, edit_name, edit_duration, set_edit_name, set_edit_duration, is_first, is_last }: SortableSectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-700 p-2 rounded mb-1"
    >
      <div className="flex items-center mb-2 sm:mb-0 sm:mr-2">
        {/* Drag handle icon */}
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-600 focus:outline-none"
          {...attributes}
          {...listeners}
          tabIndex={0}
          aria-label="Drag to reorder"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 20 20" stroke="currentColor">
            <circle cx="7" cy="7" r="1.5" />
            <circle cx="7" cy="13" r="1.5" />
            <circle cx="13" cy="7" r="1.5" />
            <circle cx="13" cy="13" r="1.5" />
          </svg>
        </button>
      </div>
      {is_editing ? (
        <div className="flex flex-col sm:flex-row sm:items-center w-full space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            value={edit_name}
            onChange={(e) => set_edit_name(e.target.value)}
            className="p-1 rounded bg-gray-600 text-white flex-1"
          />
          <input
            type="number"
            value={edit_duration}
            onChange={(e) => set_edit_duration(e.target.value)}
            className="p-1 rounded bg-gray-600 text-white w-20"
          />
          <button
            onClick={on_save}
            className="p-1 bg-green-600 rounded hover:bg-green-700 text-xs"
          >
            Save
          </button>
          <button
            onClick={on_cancel}
            className="p-1 bg-gray-500 rounded hover:bg-gray-600 text-xs"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center w-full justify-between">
          <span className="flex-1">
            {section.name} ({section.duration} min)
          </span>
          <div className="flex space-x-1 mt-2 sm:mt-0">
            <button
              onClick={on_edit}
              className="p-1 bg-yellow-600 rounded hover:bg-yellow-700 text-xs"
            >
              Edit
            </button>
            <button
              onClick={on_delete}
              className="p-1 bg-red-600 rounded hover:bg-red-700 text-xs"
            >
              Delete
            </button>
            <button
              onClick={on_move_up}
              className="p-1 bg-blue-500 rounded hover:bg-blue-600 text-xs"
              disabled={is_first}
            >
              ↑
            </button>
            <button
              onClick={on_move_down}
              className="p-1 bg-blue-500 rounded hover:bg-blue-600 text-xs"
              disabled={is_last}
            >
              ↓
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function StreamTimer() {
  const [sections, setSections] = useState<Section[]>([]);
  const [currentSection, setCurrentSection] = useState<number | null>(null);
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [newSectionName, setNewSectionName] = useState<string>("");
  const [newSectionDuration, setNewSectionDuration] = useState<string>("");
  const [edit_section_index, set_edit_section_index] = useState<number | null>(null);
  const [edit_section_name, set_edit_section_name] = useState<string>("");
  const [edit_section_duration, set_edit_section_duration] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Load sections from localStorage on mount
  useEffect(() => {
    const savedSections = localStorage.getItem("streamSections");
    if (savedSections) {
      setSections(JSON.parse(savedSections));
    }
  }, []);

  // Save sections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("streamSections", JSON.stringify(sections));
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

  // Edit section handlers
  const start_edit_section = (index: number) => {
    set_edit_section_index(index);
    set_edit_section_name(sections[index].name);
    set_edit_section_duration(sections[index].duration.toString());
  };

  const save_edit_section = (index: number) => {
    if (!edit_section_name || !edit_section_duration) return;
    const updated_sections = sections.map((section, i) =>
      i === index
        ? { name: edit_section_name, duration: parseInt(edit_section_duration) }
        : section
    );
    setSections(updated_sections);
    set_edit_section_index(null);
    set_edit_section_name("");
    set_edit_section_duration("");
  };

  const cancel_edit_section = () => {
    set_edit_section_index(null);
    set_edit_section_name("");
    set_edit_section_duration("");
  };

  // Move section up/down
  const move_section = (index: number, direction: 'up' | 'down') => {
    const new_index = direction === 'up' ? index - 1 : index + 1;
    if (new_index < 0 || new_index >= sections.length) return;
    const updated_sections = [...sections];
    const temp = updated_sections[index];
    updated_sections[index] = updated_sections[new_index];
    updated_sections[new_index] = temp;
    setSections(updated_sections);
  };

  // Keyboard shortcuts: S=start, P=pause, R=reset
  useEffect(() => {
    const handle_keydown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (event.key === 's' || event.key === 'S') {
        startTimer();
      } else if (event.key === 'p' || event.key === 'P') {
        pauseTimer();
      } else if (event.key === 'r' || event.key === 'R') {
        resetTimer();
      }
    };
    window.addEventListener('keydown', handle_keydown);
    return () => window.removeEventListener('keydown', handle_keydown);
  }, [startTimer, pauseTimer, resetTimer, isRunning, sections, currentSection, time]);

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event;
            if (active.id !== over?.id) {
              const oldIndex = sections.findIndex((_, i) => i.toString() === active.id);
              const newIndex = sections.findIndex((_, i) => i.toString() === over?.id);
              setSections((sections) => arrayMove(sections, oldIndex, newIndex));
            }
          }}
        >
          <SortableContext
            items={sections.map((_, i) => i.toString())}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {sections.map((section, index) => (
                <SortableSectionItem
                  key={index}
                  id={index.toString()}
                  index={index}
                  section={section}
                  is_editing={edit_section_index === index}
                  on_edit={() => start_edit_section(index)}
                  on_delete={() => setSections(sections.filter((_, i) => i !== index))}
                  on_move_up={() => move_section(index, 'up')}
                  on_move_down={() => move_section(index, 'down')}
                  on_save={() => save_edit_section(index)}
                  on_cancel={cancel_edit_section}
                  edit_name={edit_section_name}
                  edit_duration={edit_section_duration}
                  set_edit_name={set_edit_section_name}
                  set_edit_duration={set_edit_section_duration}
                  is_first={index === 0}
                  is_last={index === sections.length - 1}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
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
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2 mb-2">
          <span className="text-xs text-gray-400 flex items-center">
            <kbd className="bg-gray-700 px-2 py-1 rounded font-mono text-xs mr-1 border border-gray-600">S</kbd>
            Start
          </span>
          <span className="text-xs text-gray-400 flex items-center">
            <kbd className="bg-gray-700 px-2 py-1 rounded font-mono text-xs mr-1 border border-gray-600">P</kbd>
            Pause
          </span>
          <span className="text-xs text-gray-400 flex items-center">
            <kbd className="bg-gray-700 px-2 py-1 rounded font-mono text-xs mr-1 border border-gray-600">R</kbd>
            Reset
          </span>
        </div>
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
    </div>
  );
}
