# Elementsist Brand Consultation

This project is a web-based application designed to emulate a sophisticated, knowledgeable brand consultant. It interacts with business owners and brand representatives through a conversational chat interface, gathering insights about their brand and generating a custom brand audit report.

## Features

- Interactive Chat Interface
- Adaptive Interview Process
- Custom Report Generation
- PDF Compilation
- Persistent User Sessions

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository:
   ```
   git clone ...
   ```

2. Navigate to the project directory:
   ```
   cd ...
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env` file in the root directory and add your environment variables. You can use the `.env.example` file as a template.

5. Start the development server:
   ```
   npm run dev
   ```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file:

- `VITE_OPENAI_API_KEY`: Your OpenAI API key
- `VITE_FIREBASE_API_KEY`: Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Your Firebase app ID

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
