# NYRA - Intelligent Personal Safety Ecosystem 🚨

[![React Native](https://img.shields.io/badge/React%20Native-0.72+-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2049+-black.svg)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-lightgrey.svg)](https://github.com/your-username/nyra-safety-app)

## 📱 Overview

**NYRA (Need Your Rapid Assistance)** is an advanced, all-in-one personal safety ecosystem designed to protect users through state-of-the-art AI, continuous real-time monitoring, and highly reliable community networks. Built on React Native for seamless cross-platform operation, NYRA proactively anticipates danger, automates emergency responses, and mobilizes swift assistance.

## ✨ Core Features

### 🤖 AI-Powered Emergency Detection (TFLite)
- **Human Activity Recognition (HAR)**: On-device ML models constantly analyze accelerometer and gyroscope data to recognize distress physically.
- **Fall & Impact Detection**: Automatically detects sudden falls, physical impacts, or anomalous struggles.
- **Zero-Latency Processing**: Purely on-device inference ensures instantaneous detection without requiring an internet connection.

### 🔐 Dual Protection Alert System
- **Automated Emergency Calls & SMS**: In critical situations, NYRA triggers an automated voice call to emergency contacts, instantly followed by an automated SMS carrying precise GPS coordinates.
- **Fail-Safe Fallback**: If a call fails to connect, the system falls back to SMS immediately, ensuring the SOS message always gets through.
- **Panic Button**: Discrete hardware-bound or on-screen one-touch SOS activation.

### 👥 Community & Geofencing Intelligence
- **Community Map & Incident Sharing**: See nearby communities, live incident reports, and real-time alerts submitted by other users.
- **Danger Zones**: Automated geofencing maps out known high-risk areas and pre-alerts users when they enter these zones.
- **Walk With Me**: Live journey tracking that lets trusted contacts digitally escort you home, ensuring you never walk alone.

### ⚕️ Comprehensive Medical Profile
- **Emergency Medical Info**: Dedicated hub to store blood group, allergies, emergency conditions, and medications, vital for first responders when every second counts.
- **Smart Safety Modes**: Context-aware settings (e.g., Idle, Walking, Running, Shield Up) automatically tuning the sensitivity of detection sensors based on the user's current environment.

## 🚀 Quick Setup & Installation

### Prerequisites
- Node.js 18+ and `npm`/`yarn`
- Expo CLI (`npm install -g @expo/cli`)
- React Native environment (Android Studio / Xcode)

### Installation
```bash
git clone https://github.com/your-username/nyra-safety-app.git
cd nyra-safety-app
npm install
```

### Start Development Server
```bash
npx expo start
```
*Run on physical device using Expo Go by scanning the QR code, or press `a`/`i` for Android/iOS simulators.*

## 🔒 Privacy First

- **Local Inference**: ML computation happens exclusively on your device.
- **End-to-End Encryption**: Personal contacts, medical data, and real-time tracking are tightly encrypted.
- **No Unwanted Tracking**: Geographic data is primarily kept localized or within strict, user-approved community circles.

## 🤝 Contributing

We welcome contributions to strengthen safety globally! Please branch, commit your incredible features, and open a Pull Request.

---
**Made with ❤️ by Supriya & Rakesh**