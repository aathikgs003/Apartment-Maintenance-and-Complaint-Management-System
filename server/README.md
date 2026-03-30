# 🏠 Apartment Maintenance System - Backend API

A production-ready RESTful API for managing apartment maintenance complaints, built with Node.js, Express, and MongoDB.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Running the Server](#-running-the-server)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)
- [Error Handling](#-error-handling)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### User Management
- 👤 Three user roles: Resident, Staff, Admin
- 🔐 JWT-based authentication with httpOnly cookies
- 🔑 Secure password hashing with bcrypt
- 📱 Role-based access control

### Complaint Management
- 📝 Create, read, update, delete complaints
- 📷 Image upload support (up to 5 images per complaint)
- 🏷️ Category and priority classification
- 📊 Status tracking (Pending → Assigned → In Progress → Completed → Closed)
- ⏰ Deadline monitoring with automatic delay detection

### Notifications
- 🔔 Real-time notification system
- 📧 Email notifications for important events
- ✅ Mark as read functionality
- 🧹 Automatic cleanup of old notifications

### Analytics (Admin)
- 📈 Dashboard statistics
- 👷 Staff performance metrics
- 📊 Complaint trends and category analysis
- ⏱️ Delay analytics

### Background Jobs
- ⏰ Deadline monitoring (hourly)
- ⚠️ Deadline warnings (every 30 minutes)
- 📊 Daily summary reports
- 🧹 Notification cleanup (daily)

## 🛠️ Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.x
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **File Upload:** Multer + Cloudinary
- **Image Processing:** Sharp
- **Email:** Nodemailer
- **Scheduler:** node-cron
- **Security:** Helmet, CORS, Rate Limiting
- **Validation:** express-validator

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)
- **Cloudinary** account (for image storage)

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/apartment-maintenance-system.git
cd apartment-maintenance-system/server