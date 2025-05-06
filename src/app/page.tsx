import StreamSchedule from "../components/StreamScheduler";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <StreamSchedule />
      <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
        <a
          href="https://github.com/moikas-code/StreamSchedule"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-primary"
        >
          GitHub
        </a>
        <a
          href="http://moikas.com"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-secondary"
        >
          Support
        </a>
      </div>
    </div>
  );
}
