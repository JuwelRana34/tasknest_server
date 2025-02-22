# 🐦 TaskNest  

A collaborative task management application built with **Node.js, Express, MongoDB, and Socket.io**, providing real-time updates and secure user authentication.  

## 📑 Table of Contents  

- [Features](#-features)  
- [Installation](#-installation)  
- [Usage](#-usage)  
- [Dependencies](#-dependencies)  
- [Configuration](#-configuration)  
- [Contributing](#-contributing)  
- [License](#-license)  

## ✨ Features  

- 📝 Task creation, editing, and deletion  
- 🔒 User authentication with **JWT**  
- 🔄 Real-time task updates using **Socket.io**  
- 🌍 Cross-Origin Resource Sharing (**CORS**) support  
- 🛠 Environment-based configuration with **dotenv**  
- 📦 MongoDB integration with **Mongoose**  

## ⚙ Installation  

```sh
git clone https://github.com/your-username/taskNest.git
cd taskNest
npm install
```

## 🚀 Usage  

1. Create a `.env` file in the root directory and configure your environment variables (e.g., database URL, JWT secret).  
2. Start the server:  

   ```sh
   npm start
   ```

3. Open your frontend or API testing tool to interact with the application.  

## 📦 Dependencies  

| Package        | Version  |
|---------------|----------|
| cookie-parser | ^1.4.7   |
| cors          | ^2.8.5   |
| dotenv        | ^16.4.5  |
| express       | ^4.21.1  |
| jsonwebtoken  | ^9.0.2   |
| mongodb       | ^6.11.0  |
| mongoose      | ^8.10.1  |
| socket.io     | ^4.8.1   |

## ⚙ Configuration  

- **PORT:** Server port (default: `3000`)  
- **MONGO_URI:** MongoDB connection string  
- **JWT_SECRET:** Secret key for JSON Web Tokens  

## 🤝 Contributing  

Feel free to fork this repo, submit pull requests, or report issues!  

## 📜 License  

This project is licensed under the **MIT License**.  
