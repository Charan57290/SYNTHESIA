# 🎵 Synthesia – Music Streaming Platform

Synthesia is a full-stack music streaming web application developed using the MERN stack. It allows users to browse and stream music through a responsive interface with secure authentication and efficient media handling.

---

## 🚀 Features
- Responsive and user-friendly music streaming interface  
- Secure user authentication and authorization  
- Browse and stream audio content  
- Upload and manage audio and image files  
- RESTful APIs for handling users and music data  

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- JavaScript (ES6+)

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

### Tools & Libraries
- Multer (media uploads)
- Git & GitHub

---

## 📂 Project Structure

Synthesia/
├── backend/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── middleware/
│ ├── server.js
│ └── .env
├── frontend/
│ ├── src/
│ ├── components/
│ ├── main.jsx
│ └── vite.config.js
├── scripts/
│ ├── start-backend.sh
│ └── start-frontend.sh
├── docker-compose.yml
└── README.md


---

## 🧾 Bash Scripts

### start-backend.sh
```bash
#!/bin/bash
cd backend
npm install
npm start
start-frontend.sh
#!/bin/bash
cd frontend
npm install
npm run dev

🧾 YAML Configuration
docker-compose.yml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGO_URI=mongodb://mongo:27017/synthesia
    depends_on:
      - mongo

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

  mongo:
    image: mongo
    ports:
      - "27017:27017"

🔐 Authentication & Media Handling
Authentication is implemented using middleware to protect routes

Audio and image uploads are handled using Multer

📄 License

MIT License

Copyright (c) 2025 Thota Kali Charan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
MongoDB is used to store user data and music metadata

🎯 Project Objective
This project was developed to gain hands-on experience in full-stack web development, focusing on frontend–backend integration, RESTful APIs, authentication, and media file handling using modern web technologies.

