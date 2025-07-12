# Smart Warehouse Tracker - Setup Guide

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sidharthan-B/EcoWare.git
   cd EcoWare
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000` (or the port shown in terminal)

## Features

- **Carbon Footprint Tracking**: Monitor warehouse emissions
- **Demand Forecasting**: Upload CSV data and predict future demand
- **Emission Reduction Simulator**: Test different reduction scenarios
- **Real-time Dashboard**: Live warehouse data monitoring
- **CSV Import**: Import historical data for analysis

## CSV Format for Demand Forecasting

Create a CSV file with the following columns:
```csv
date,item_name,quantity,movement_type
2024-01-01,Milk Packet,50,out
2024-01-02,Milk Packet,45,out
2024-01-03,Milk Packet,55,out
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Recharts
- Lucide React Icons 