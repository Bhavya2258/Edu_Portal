# 🎓 Edu_Portal

An AI-powered educational portal designed to make learning more interactive, accessible, and personalized.

Edu_Portal brings educational tools and AI-assisted learning capabilities into a single web application, with a focus on improving the overall student learning experience.

## ✨ Features

* 🤖 AI-assisted learning
* 🔐 User authentication
* 📚 Interactive educational tools
* 🎯 Personalized learning experience
* 💻 Responsive web interface
* 🧩 Modular architecture for extending features
* 🔌 Flexible AI integration

## 🛠️ Tech Stack

The current implementation uses:

* **TypeScript**
* **Vite**
* **Node.js**
* **Web technologies (HTML/CSS/TypeScript)**

The AI functionality is implemented through an API integration layer, allowing the underlying AI service to be changed without redesigning the entire application.

## 🤖 AI Integration

Edu_Portal is **not dependent on a specific AI platform**.

The AI layer can be connected to different providers or models, including:

* OpenAI
* Google Gemini
* Anthropic Claude
* Open-source models
* Self-hosted models
* Other compatible AI APIs

This allows the project to evolve as different models, APIs, and technologies become available.

> The current implementation may require configuration specific to the AI provider being used.

## 🚀 Getting Started

### Prerequisites

Make sure you have:

* [Node.js](https://nodejs.org/) installed
* npm, Bun, or another compatible package manager
* An API key for the AI provider configured in your implementation

### Installation

Clone the repository:

```bash
git clone https://github.com/Bhavya2258/Edu_Portal.git
```

Navigate into the project:

```bash
cd Edu_Portal
```

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root.

Configure the environment variables required by your selected AI provider.

For example:

```env
AI_API_KEY=your_api_key_here
```

> Do not commit API keys, credentials, or other secrets to GitHub.

### Run the Application

Start the development server:

```bash
npm run dev
```

Open the local development URL provided in the terminal.

## 📂 Project Structure

```text
Edu_Portal/
├── src/                # Application source code
├── public/             # Static assets
├── server.ts           # Server-side functionality
├── index.html          # Application entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Project dependencies and scripts
└── README.md           # Project documentation
```

## 🧠 Design Philosophy

Edu_Portal is designed with a separation between the application and the AI service.

```text
┌─────────────────────┐
│     User Interface  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Application Logic  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   AI Integration    │
│       Layer         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   AI Provider /     │
│       Model         │
└─────────────────────┘
```

This approach makes it easier to replace or extend the AI functionality without coupling the entire application to one provider.

## 🛣️ Roadmap

* [ ] Support multiple AI providers
* [ ] Expand interactive learning tools
* [ ] Add personalized learning recommendations
* [ ] Improve authentication and user management
* [ ] Add learning progress tracking
* [ ] Add analytics dashboard
* [ ] Improve testing and error handling
* [ ] Add production deployment configuration

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/your-feature
```

3. Make your changes
4. Commit your changes

```bash
git commit -m "Add your feature"
```

5. Push your branch

```bash
git push origin feature/your-feature
```

6. Open a Pull Request

## 📄 License

See the repository for licensing information.

---

**Edu_Portal** — Building a more interactive and accessible learning experience.
