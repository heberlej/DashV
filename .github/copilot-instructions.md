# DashV - Project Instructions

## Overview
DashV is a Proxmox Dashboard that automatically discovers and displays services from containers and VMs. It features real-time updates via WebSockets when services change.

## Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js/Express + TypeScript + Socket.io
- **Database**: PostgreSQL
- **Container Runtime**: Docker Compose

## Development Guidelines
- Keep TypeScript strict mode enabled
- Use environment variables for all configuration
- WebSocket updates for real-time service changes
- Proxmox API integration for container management
