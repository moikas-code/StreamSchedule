# Stream Scheduler

Stream Scheduler is a web application for streamers and event hosts to create, manage, and share detailed streaming schedules. Each schedule consists of multiple sections, each with a custom name and duration, and a built-in timer to help you stay on track during your stream or event.

## Features

- Create and manage a list of schedule sections, each with a name and duration (in minutes)
- Drag-and-drop reordering of sections
- Edit and delete sections easily
- Start, pause, and reset a timer for your schedule
- Keyboard shortcuts for timer control (S: Start, P: Pause, R: Reset)
- Generate a secure, shareable link for your schedule
- View schedules in a dedicated display mode for sharing with your audience
- All data is stored locally in your browser for privacy

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to use Stream Scheduler.

## Usage

1. Add sections to your schedule by entering a name and duration, then clicking "Add".
2. Reorder sections using drag-and-drop, or edit/delete as needed.
3. Start the timer to begin your stream or event. The timer will automatically advance to the next section when the current one ends.
4. Generate a shareable link to your schedule for your audience or collaborators. The link is secured with a token and does not expose your secret data.
5. Open the shareable link in a new tab or window to view the schedule in display mode.

## Security & Sharing

- Shareable links are generated using a secure token (JWT) that encodes your schedule data. Only those with the link can view your schedule.
- Your schedule is stored locally in your browser and is not uploaded to any server, except when generating a shareable link.
- The backend uses secure cryptographic methods to sign and verify tokens.

## Contributing

Contributions are welcome! Please open issues or submit pull requests to help improve Stream Scheduler.

## License

This project is licensed under the MIT License.
