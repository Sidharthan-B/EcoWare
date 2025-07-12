import React, { useState, useEffect, useRef } from 'react';
import { Home, Edit, Plus, Minus, Package, TrendingUp, Leaf, Clock, Flame, Snowflake, Upload, Download, BarChart3, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import ecowareLogo from '../assets/ecoware-logo.png';
import treeLogo from '../assets/tree.png';

const SmartWarehouseTracker = () => {
  const [currentPage, setCurrentPage] = useState('intro');
  const [carbonCalcTime, setCarbonCalcTime] = useState(null);
  const [warehouseData, setWarehouseData] = useState([
    { id: 1, name: 'Electricity', timestamp: '2024-01-15', unit: 0.5, amount: 0, carbon: 0, unitType: 'kWh' },
    { id: 2, name: 'Cardboard', timestamp: '2024-01-20', unit: 0.5, amount: 0, carbon: 0, unitType: 'kg' },
    { id: 3, name: 'Plastic Packaging', timestamp: '2024-02-05', unit: 0.3, amount: 0, carbon: 0, unitType: 'kg' },
    { id: 4, name: 'Diesel', timestamp: '2024-02-10', unit: 2.68, amount: 0, carbon: 0, unitType: 'litres' }
  ]);

  // Emission reduction simulation state
  const [reductionFactors, setReductionFactors] = useState({
    electricity: 0,
    packaging: 0,
    diesel: 0,
    cardboard: 0
  });

  // Real-time data state
  const [realTimeWarehouseData, setRealTimeWarehouseData] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Demand forecasting and CSV import state
  const [historicalData, setHistoricalData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [forecastPeriod, setForecastPeriod] = useState(30); // days
  const [selectedItem, setSelectedItem] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [csvError, setCsvError] = useState('');
  const fileInputRef = useRef(null);

  const updateAmount = (id, change) => {
    setWarehouseData(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              amount: Math.max(0, item.amount + change),
              carbon: Math.max(0, calculateCarbonEmission(item.name, item.amount + change, item.unit))
            }
          : item
      )
    );
  };

  // Carbon emission calculation with proper factors
  const calculateCarbonEmission = (itemName, amount, unit) => {
    // Unit now contains the emission factor directly
    return amount * unit;
  };

  // Helper function to get emission factor text
  const getEmissionFactorText = (itemName) => {
    const name = itemName.toLowerCase();
    
    if (name.includes('electricity')) {
      return "0.5 kg CO₂/kWh";
    } else if (name.includes('diesel')) {
      return "2.68 kg CO₂/litre";
    } else if (name.includes('cardboard')) {
      return "0.5 kg CO₂/kg";
    } else if (name.includes('plastic packaging')) {
      return "0.3 kg CO₂/kg";
    } else {
      return "Variable";
    }
  };

  const totalCarbon = warehouseData.reduce((sum, item) => sum + item.carbon, 0);
  const treesNeeded = Math.ceil(totalCarbon / 20);

  const chartData = warehouseData.map((item, index) => ({
    x: index + 1,
    y: item.carbon
  }));

  const maxValue = Math.max(...chartData.map(d => d.y), 80);

  // --- Start of integrated WarehouseDashboard logic ---
  // Item configuration for real-time simulation
  const items = {
    "Milk Packet": { id: "A101", emissionFactor: 50 },
    "Modern Bread": { id: "A102", emissionFactor: 40 },
    "Toothpaste": { id: "A103", emissionFactor: 70 },
    "Notebook": { id: "A104", emissionFactor: 90 },
    "Rice": { id: "A105", emissionFactor: 120 },
    "Sugar": { id: "A106", emissionFactor: 100 }
  };

  // Simulate data generation (equivalent to simulator.py)
  const generateRealTimeWarehouseData = () => {
    const itemNames = Object.keys(items);
    const randomItem = itemNames[Math.floor(Math.random() * itemNames.length)];
    const quantity = Math.floor(Math.random() * 16) + 5; // 5-20
    const timestamp = new Date().toISOString();

    const newEntry = {
      item_id: items[randomItem].id,
      name_of_the_item: randomItem,
      movement_type: "out",
      date: timestamp,
      quantity: quantity,
      emission_factor: items[randomItem].emissionFactor,
      id: Date.now() + Math.random() // Unique ID for React keys
    };

    setRealTimeWarehouseData(prev => [...prev, newEntry]);
  };

  // Filter data from last 10 minutes
  const getRecentData = () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return realTimeWarehouseData.filter(item => new Date(item.date) > tenMinutesAgo);
  };

  // Calculate demand (sum of quantities grouped by item)
  const calculateDemand = (data) => {
    const demandMap = {};
    data.forEach(item => {
      if (item.movement_type === "out") {
        demandMap[item.name_of_the_item] = (demandMap[item.name_of_the_item] || 0) + item.quantity;
      }
    });

    return Object.entries(demandMap)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  };

  // Calculate carbon emissions
  const calculateEmissions = (data) => {
    const emissionMap = {};
    data.forEach(item => {
      // Convert grams to kg
      const emission = (item.quantity * item.emission_factor) / 1000;
      emissionMap[item.name_of_the_item] = (emissionMap[item.name_of_the_item] || 0) + emission;
    });

    return Object.entries(emissionMap)
      .map(([name, emission]) => ({ name, emission }))
      .sort((a, b) => b.emission - a.emission);
  };

  // Start/stop simulation for real-time data
  useEffect(() => {
    let interval;
    if (isSimulating) {
      interval = setInterval(generateRealTimeWarehouseData, 10000); // Every 10 seconds
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Reset real-time simulation data
  const resetSimulation = () => {
    setRealTimeWarehouseData([]);
    setIsSimulating(false);
  };

  // Get processed data for real-time dashboard
  const recentRealTimeData = getRecentData();
  const demandRealTimeData = calculateDemand(recentRealTimeData);
  const emissionRealTimeData = calculateEmissions(recentRealTimeData);

  const top3Demanded = demandRealTimeData.slice(0, 3);
  const leastDemanded = demandRealTimeData.slice(-3).reverse();
  // --- End of integrated WarehouseDashboard logic ---

  // --- Demand Forecasting and CSV Import Functions ---
  
  // CSV Import Functions
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setCsvError('');
      parseCSV(file);
    } else {
      setCsvError('Please select a valid CSV file');
      setCsvFile(null);
    }
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Expected headers: date,item_name,quantity,movement_type
        const expectedHeaders = ['date', 'item_name', 'quantity', 'movement_type'];
        const hasRequiredHeaders = expectedHeaders.every(h => 
          headers.some(header => header.toLowerCase().includes(h))
        );

        if (!hasRequiredHeaders) {
          setCsvError('CSV must contain: date, item_name, quantity, movement_type columns');
          return;
        }

        const data = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 4) {
              data.push({
                date: new Date(values[0]),
                item_name: values[1],
                quantity: parseInt(values[2]) || 0,
                movement_type: values[3],
                id: Date.now() + i
              });
            }
          }
        }

        setHistoricalData(data);
        setCsvError('');
      } catch (error) {
        setCsvError('Error parsing CSV file');
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCSV = () => {
    const sampleData = `date,item_name,quantity,movement_type
2024-01-01,Milk Packet,50,out
2024-01-02,Milk Packet,45,out
2024-01-03,Milk Packet,55,out
2024-01-01,Modern Bread,30,out
2024-01-02,Modern Bread,35,out
2024-01-03,Modern Bread,25,out`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_warehouse_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Demand Forecasting Functions
  const calculateDemandForecast = () => {
    if (!selectedItem || historicalData.length === 0) return;

    // Filter data for selected item and outbound movements
    const itemData = historicalData.filter(item => 
      item.item_name === selectedItem && item.movement_type === 'out'
    );

    if (itemData.length < 3) {
      setCsvError('Need at least 3 data points for forecasting');
      return;
    }

    // Sort by date
    itemData.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate moving average (simple 3-period)
    const movingAverages = [];
    for (let i = 2; i < itemData.length; i++) {
      const avg = (itemData[i-2].quantity + itemData[i-1].quantity + itemData[i].quantity) / 3;
      movingAverages.push(avg);
    }

    // Calculate trend (linear regression)
    const n = movingAverages.length;
    const xValues = Array.from({length: n}, (_, i) => i);
    const yValues = movingAverages;

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((a, b, i) => a + (b * yValues[i]), 0);
    const sumXX = xValues.reduce((a, b) => a + (b * b), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast
    const forecast = [];
    const lastDate = new Date(itemData[itemData.length - 1].date);
    
    for (let i = 1; i <= forecastPeriod; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(lastDate.getDate() + i);
      
      const forecastValue = Math.max(0, intercept + slope * (n + i - 1));
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        quantity: Math.round(forecastValue),
        type: 'forecast'
      });
    }

    setForecastData(forecast);
  };

  const getHistoricalChartData = () => {
    if (!selectedItem) return [];

    const itemData = historicalData.filter(item => 
      item.item_name === selectedItem && item.movement_type === 'out'
    );

    return itemData.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      quantity: item.quantity,
      type: 'historical'
    }));
  };

  const getForecastChartData = () => {
    return forecastData.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      quantity: item.quantity,
      type: 'forecast'
    }));
  };

  const getCombinedChartData = () => {
    const historical = getHistoricalChartData();
    const forecast = getForecastChartData();
    
    return [...historical, ...forecast];
  };

  // Get unique items from historical data
  const getUniqueItems = () => {
    const items = [...new Set(historicalData.map(item => item.item_name))];
    return items.sort();
  };

  // Carbon Footprint Calculation Page
  const calculateFootprintLevel = (value) => {
    if (value < 150) return { level: 'Normal', color: 'green', message: 'Your carbon footprint is within a healthy range.' };
    if (value < 400) return { level: 'Moderate', color: 'yellow', message: 'Your carbon footprint is moderate. Consider reducing emissions.' };
    return { level: 'High', color: 'red', message: 'Warning: Your carbon footprint is high! Take action to reduce emissions.' };
  };
  const carbonFootprint = totalCarbon; // Use totalCarbon from warehouseData
  const carbonFootprintLevel = calculateFootprintLevel(carbonFootprint);
  const handleCalculateFootprint = () => {
    setCarbonCalcTime(new Date());
  };
  // Helper for reduction suggestions
  const targetFootprint = 100; // Normal threshold in kg
  const excessFootprint = carbonFootprint - targetFootprint;
  let reductionSuggestions = [];
  if (carbonFootprintLevel.level === 'High' && excessFootprint > 0 && totalCarbon > 0) {
    // Calculate each category's share and how much to reduce
    reductionSuggestions = warehouseData.map(item => {
      const share = item.carbon / totalCarbon;
      const reduction = (share * excessFootprint);
      return {
        name: item.name,
        current: item.carbon,
        reduceBy: reduction,
        newValue: item.carbon - reduction > 0 ? item.carbon - reduction : 0
      };
    });
  }
  // Simulated past carbon footprint data (e.g., for the last 6 months)
  const pastFootprintData = [
    { month: 'Feb', value: 120 },
    { month: 'Mar', value: 140 },
    { month: 'Apr', value: 180 },
    { month: 'May', value: 210 },
    { month: 'Jun', value: 250 },
    { month: 'Jul', value: carbonFootprint }
  ];
  // Simple linear prediction for next month
  const lastMonth = pastFootprintData[pastFootprintData.length - 1];
  const prevMonth = pastFootprintData[pastFootprintData.length - 2];
  let predictedNext = lastMonth.value + (lastMonth.value - prevMonth.value);
  if (predictedNext < 0) predictedNext = 0;
  const predictedLevel = calculateFootprintLevel(predictedNext);
  const CarbonFootprintPage = () => (
    <div className="flex-1 bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Carbon Footprint Calculation</h2>
          <p className="text-gray-600">Analyze your warehouse's carbon footprint and get actionable insights.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-8">
          <div className="flex-1 text-center">
            <div className={`inline-block px-8 py-8 rounded-full bg-${carbonFootprintLevel.color}-100`}>
              <span className={`text-5xl font-bold text-${carbonFootprintLevel.color}-700`}>{carbonFootprint.toFixed(2)} kg</span>
            </div>
            <div className="mt-4 text-lg text-gray-700">Total Carbon Footprint</div>
            {carbonCalcTime && (
              <div className="mt-2 text-sm text-gray-500">Calculated at: {carbonCalcTime.toLocaleString()}</div>
            )}
            <button
              onClick={handleCalculateFootprint}
              className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors font-medium"
            >
              Calculate Now
            </button>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[{ name: 'Footprint', value: carbonFootprint }]}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} kg CO₂`, 'Footprint']} />
                <Bar dataKey="value" fill="#10b981" barSize={83} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="text-center mt-8">
          <div className={`inline-block px-6 py-3 rounded-lg bg-${carbonFootprintLevel.color}-100 text-${carbonFootprintLevel.color}-700 text-xl font-semibold mb-2`}>
            {carbonFootprintLevel.level}
          </div>
          <div className="text-lg text-gray-700 mb-4">{carbonFootprintLevel.message}</div>
          {carbonFootprintLevel.level === 'High' && (
            <div className="text-red-600 font-bold text-lg mb-6">⚠️ Immediate action recommended!</div>
          )}
          {carbonFootprintLevel.level === 'Moderate' && (
            <div className="text-yellow-700 font-medium text-base mb-6">⚠️ Your carbon footprint is moderate. Consider taking steps to reduce emissions for better sustainability.</div>
          )}
         {carbonFootprintLevel.level === 'High' && reductionSuggestions.length > 0 && (
           <div className="mt-8">
             <h4 className="text-xl font-semibold text-gray-800 mb-4">How to reach a normal carbon footprint:</h4>
             <div className="overflow-x-auto">
               <table className="min-w-full bg-white rounded-lg shadow">
                 <thead>
                   <tr>
                     <th className="px-4 py-2 text-left text-gray-600">Category</th>
                     <th className="px-4 py-2 text-right text-gray-600">Current (kg)</th>
                     <th className="px-4 py-2 text-right text-gray-600">Reduce by (kg)</th>
                     <th className="px-4 py-2 text-right text-gray-600">Target (kg)</th>
                   </tr>
                 </thead>
                 <tbody>
                   {reductionSuggestions.map((item, idx) => (
                     <tr key={idx} className="border-t">
                       <td className="px-4 py-2">{item.name}</td>
                       <td className="px-4 py-2 text-right">{item.current.toFixed(2)}</td>
                       <td className="px-4 py-2 text-right text-red-600 font-semibold">-{item.reduceBy.toFixed(2)}</td>
                       <td className="px-4 py-2 text-right">{item.newValue.toFixed(2)}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             <div className="text-sm text-gray-500 mt-2">* Reduce each category by the shown amount to reach a normal carbon footprint.</div>
           </div>
         )}
        </div>
        {/* Carbon Footprint Trend */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Carbon Footprint Trend</h3>
          <div className="bg-gray-50 rounded-lg p-6">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={pastFootprintData.concat([{ month: 'Next', value: predictedNext }])}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" minTickGap={10} />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} kg CO₂`, 'Footprint']} />
                <Bar dataKey="value" fill="#10b981" barSize={40} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 text-center">
              {predictedNext === 0 ? (
                <span className="text-lg text-green-700 font-semibold">Your carbon footprint is on track to remain very low next month.</span>
              ) : (
                <>
                  <span className="text-lg text-gray-700">If this trend continues, your carbon footprint next month will be </span>
                  <span className={`font-bold text-${predictedLevel.color}-700`}>{predictedNext.toFixed(2)} kg</span>
                  <span className="text-lg text-gray-700">, which is </span>
                  <span className={`font-bold text-${predictedLevel.color}-700`}>{predictedLevel.level}</span>
                  <span className="text-lg text-gray-700">.</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const IntroPage = () => (
    <div className="flex-1 bg-gradient-to-br from-green-50 to-blue-50 p-8 relative overflow-hidden flex items-center justify-center">
      <div className="absolute top-4 right-4 opacity-20">
        <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-blue-400 rounded-full"></div>
      </div>
      <div className="max-w-2xl w-full mx-auto text-center flex flex-col items-center justify-center">
        <div className="flex flex-col items-center mb-8">
          <img src={ecowareLogo} alt="EcoWare Logo" className="h-32 w-auto mb-4" />
        </div>
        <div className="space-y-6 text-gray-600 text-lg">
          <p>
            By monitoring and calculating carbon emissions from warehouse operations including electricity consumption, packaging materials, and diesel usage, you can optimize your logistics and reduce environmental impact.
          </p>
          <p>
            Track emissions from electricity, cardboard packaging, diesel consumption, and other warehouse activities. Our carbon calculator provides comprehensive insights into your facility's environmental footprint and suggests actionable improvements.
          </p>
          <p>
            Make data-driven decisions to create a more sustainable warehouse operation while maintaining efficiency and reducing costs through smart resource management.
          </p>
        </div>
        <p className="mt-8 text-xl text-green-700 font-medium">
          Wishing you a low-carbon warehouse operation!
        </p>
      </div>
    </div>
  );

  const WarehouseDataPage = () => (
    <div className="flex-1 bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Fill up your warehouse data</h2>
          <div className="flex gap-4">
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <Edit className="w-5 h-5 text-gray-600" />
            </button>
            <button className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors font-medium">
              Add new
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 text-gray-500 font-medium">#</th>
                <th className="text-left py-4 px-4 text-gray-500 font-medium">name</th>
                <th className="text-left py-4 px-4 text-gray-500 font-medium">timestamp</th>
                <th className="text-left py-4 px-4 text-gray-500 font-medium">Emission Factor</th>
                <th className="text-left py-4 px-4 text-gray-500 font-medium">Amount</th>
                <th className="text-left py-4 px-4 text-gray-500 font-medium">Carbon, kg</th>
              </tr>
            </thead>
            <tbody>
              {warehouseData.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 text-gray-600">{item.id}</td>
                  <td className="py-4 px-4 text-gray-800 font-medium">{item.name}</td>
                  <td className="py-4 px-4 text-gray-600">{item.timestamp}</td>
                  <td className="py-4 px-4 text-gray-600">
                    {getEmissionFactorText(item.name)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateAmount(item.id, -1)}
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center text-gray-800">{item.amount}</span>
                      <button
                        onClick={() => updateAmount(item.id, 1)}
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{item.unitType}</div>
                  </td>
                  <td className="py-4 px-4 text-gray-800 font-medium">{item.carbon.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <p className="text-sm text-blue-600 mb-4">
            <a href="#" className="hover:underline">List of warehouse operations and carbon footprint data</a>
          </p>

          <h3 className="text-2xl font-bold text-gray-800 mb-6">Your carbon emission per operation</h3>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="relative h-80">
              <svg className="w-full h-full" viewBox="0 0 500 280">
                {/* Y-axis labels */}
                {[0, 20, 40, 60, 80].map((value) => (
                  <g key={value}>
                    <text
                      x="30"
                      y={220 - (value / maxValue) * 160}
                      className="text-xs fill-gray-400"
                      textAnchor="end"
                    >
                      {value}
                    </text>
                    <line
                      x1="40"
                      y1={220 - (value / maxValue) * 160}
                      x2="460"
                      y2={220 - (value / maxValue) * 160}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  </g>
                ))}

                {/* X-axis labels */}
                {chartData.map((point, index) => (
                  <text
                    key={index}
                    x={60 + index * 80}
                    y="250"
                    className="text-xs fill-gray-400"
                    textAnchor="middle"
                  >
                    {point.x.toString().padStart(2, '0')}
                  </text>
                ))}

                {/* Data bars */}
                {chartData.map((point, index) => {
                  const height = (point.y / maxValue) * 160;
                  return (
                    <rect
                      key={index}
                      x={50 + index * 80}
                      y={220 - height}
                      width="40"
                      height={height}
                      fill="#10b981"
                      className="hover:fill-green-600 transition-colors"
                    />
                  );
                })}
              </svg>
            </div>

            <div className="text-center mt-6">
              <p className="text-xl font-semibold text-gray-800">
                Your carbon emission is {totalCarbon.toFixed(0)} kg
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Trees needed to offset your emissions</h3>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500 rounded-full text-white text-4xl font-bold mb-4">
              {treesNeeded}
            </div>
            <div className="ml-4 inline-block align-middle relative top-2">
              <img src={treeLogo} alt="tree" className="w-16 h-16" />
            </div>

            <p className="text-gray-600 mt-4">
              1 tree offsets ≈ 20 kg of carbon each year
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const DemandEmissionsDashboard = () => (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📦 Real-Time Demand & Carbon Emission Dashboard
          </h1>
          <p className="text-gray-600">Live warehouse monitoring and analytics</p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isSimulating
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
              </button>
              <button
                onClick={generateRealTimeWarehouseData}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
              >
                Generate Sample Data
              </button>
              <button
                onClick={resetSimulation}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Reset Simulation
              </button>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Package className="w-4 h-4 mr-1" />
                Total Records: {realTimeWarehouseData.length}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Last 10 mins: {recentRealTimeData.length}
              </div>
              <div className={`flex items-center ${isSimulating ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${isSimulating ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                {isSimulating ? 'Simulating' : 'Stopped'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Column 1: Demand Analysis */}
          <div className="space-y-6">
            {/* Top 3 Most Demanded */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Flame className="w-5 h-5 mr-2 text-red-500" />
                🔥 Top 3 Most Demanded Products (Last 10 mins)
              </h3>
              {top3Demanded.length > 0 ? (
                <div className="space-y-3">
                  {top3Demanded.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                          index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-red-600">{item.quantity} units</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent demand data</p>
              )}
            </div>

            {/* Least Demanded */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Snowflake className="w-5 h-5 mr-2 text-blue-500" />
                ❄ Least Demanded (But Moved) Products
              </h3>
              {leastDemanded.length > 0 ? (
                <div className="space-y-3">
                  {leastDemanded.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">{item.name}</span>
                      <span className="font-bold text-blue-600">{item.quantity} units</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent movement data</p>
              )}
            </div>
          </div>

          {/* Column 2: Carbon Emissions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Leaf className="w-5 h-5 mr-2 text-green-500" />
              🌿 CO₂ Emission by Product
            </h3>
            {emissionRealTimeData.length > 0 ? (
              <div className="space-y-3">
                {emissionRealTimeData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-bold text-green-600">{item.emission.toLocaleString()} kg CO₂</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No emission data available</p>
            )}
          </div>
        </div>

        {/* Demand Stock Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-purple-500" />
            Demand Stock Analysis
          </h2>

          {/* Bar Chart */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">📈 Demand Trend (Live Window)</h3>
            {demandRealTimeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={demandRealTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [value, 'Quantity']}
                    labelFormatter={(label) => `Product: ${label}`}
                  />
                  <Bar dataKey="quantity" fill="#8884d8" barSize={62} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No demand data to display
              </div>
            )}
          </div>

          {/* Recent Activity Log */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Activity (Last 10 minutes)</h3>
            <div className="max-h-64 overflow-y-auto">
              {recentRealTimeData.length > 0 ? (
                <div className="space-y-2">
                  {recentRealTimeData.slice().reverse().map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{item.name_of_the_item}</span>
                        <span className="text-gray-500">({item.item_id})</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-red-600">{item.quantity} units out</span>
                        <span className="text-gray-500">{new Date(item.date).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {recentRealTimeData.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
            <div className="text-gray-600">Total Units Moved (10 mins)</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {emissionRealTimeData.reduce((sum, item) => sum + item.emission, 0).toLocaleString()}
            </div>
            <div className="text-gray-600">Total CO₂ Emissions (kg)</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {demandRealTimeData.length}
            </div>
            <div className="text-gray-600">Active Products</div>
          </div>
        </div>
      </div>
    </div>
  );

  const TotalPage = () => {
    // Calculate total emissions from both warehouse data and real-time data
    const warehouseTotalCarbon = warehouseData.reduce((sum, item) => sum + item.carbon, 0);
    const realTimeTotalCarbon = emissionRealTimeData.reduce((sum, item) => sum + item.emission, 0);
    const totalCarbonEmissions = warehouseTotalCarbon + realTimeTotalCarbon;
    
    // Calculate environmental impact
    const treesNeededForOffset = Math.ceil(totalCarbonEmissions / 20);
    const carsEquivalent = (totalCarbonEmissions / 1000 / 2.3 * 12).toFixed(2); // 2.3 tons CO2 per car per year, now per month
    const flightsEquivalent = (totalCarbonEmissions / 1000 / 0.9).toFixed(2); // 0.9 tons CO2 per flight (Delhi to Dubai)
    
    // Determine impact level
    const getImpactLevel = (emissions) => {
      if (emissions < 100) return { level: 'Low', color: 'green', bg: 'bg-green-100', text: 'text-green-700' };
      if (emissions < 500) return { level: 'Moderate', color: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700' };
      if (emissions < 1000) return { level: 'High', color: 'orange', bg: 'bg-orange-100', text: 'text-orange-700' };
      return { level: 'Critical', color: 'red', bg: 'bg-red-100', text: 'text-red-700' };
    };
    
    const impactLevel = getImpactLevel(totalCarbonEmissions);
    
    // Calculate monthly trend
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const now = new Date();
    const currentMonthName = monthNames[now.getMonth()];
    const monthlyData = [
      { month: 'Jan', emissions: 120 },
      { month: 'Feb', emissions: 180 },
      { month: 'Mar', emissions: 150 },
      { month: 'Apr', emissions: 220 },
      { month: 'May', emissions: 280 },
      { month: 'Jun', emissions: 300 },
      { month: currentMonthName, emissions: Number(totalCarbonEmissions.toFixed(2)) }
    ];

    return (
      <div className="flex-1 bg-gradient-to-br from-green-50 to-blue-50 p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Total Carbon Emissions Summary</h2>
            <p className="text-gray-600 text-lg">Comprehensive overview of your warehouse's environmental impact</p>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Carbon Emissions */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {totalCarbonEmissions.toFixed(0)} kg
              </div>
              <div className="text-gray-600 font-medium">Total CO₂ Emissions</div>
            </div>

            {/* Impact Level */}
            <div className={`${impactLevel.bg} rounded-xl p-6 text-center`}>
              <div className={`text-3xl font-bold ${impactLevel.text} mb-2`}>
                {impactLevel.level}
              </div>
              <div className="text-gray-600 font-medium">Impact Level</div>
            </div>

            {/* Trees Needed */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {treesNeededForOffset}
              </div>
              <div className="text-gray-600 font-medium">Trees for Offset</div>
            </div>

            {/* Real-time Data */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {realTimeWarehouseData.length}
              </div>
              <div className="text-gray-600 font-medium">Live Records</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Warehouse Operations Breakdown */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Warehouse Operations Breakdown</h3>
              <div className="space-y-3">
                {warehouseData.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.timestamp}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800">{item.carbon.toFixed(0)} kg CO₂</div>
                      <div className="text-sm text-gray-500">{item.amount} units</div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Operations:</span>
                    <span className="text-blue-600">{warehouseTotalCarbon.toFixed(0)} kg CO₂</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Emissions */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Real-time Product Emissions</h3>
              {emissionRealTimeData.length > 0 ? (
                <div className="space-y-3">
                  {emissionRealTimeData.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="font-bold text-green-600">{item.emission.toFixed(0)} kg CO₂</div>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total Real-time:</span>
                      <span className="text-green-600">{realTimeTotalCarbon.toFixed(0)} kg CO₂</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📦</div>
                  <p>No real-time data available</p>
                  <p className="text-sm">Start simulation to see live emissions</p>
                </div>
              )}
            </div>
          </div>

          {/* Environmental Impact Equivalents */}
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Environmental Impact Equivalents</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl mb-2">🚗</div>
                <div className="text-2xl font-bold text-gray-800">{carsEquivalent}</div>
                <div className="text-gray-600">Cars driven for 1 month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">✈️</div>
                <div className="text-2xl font-bold text-gray-800">{flightsEquivalent}</div>
                <div className="text-gray-600">Flights (Delhi to Dubai)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🌳</div>
                <div className="text-2xl font-bold text-gray-800">{treesNeededForOffset}</div>
                <div className="text-gray-600">Trees needed to offset</div>
              </div>
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Emissions Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} kg CO₂`, 'Emissions']} />
                <Bar dataKey="emissions" fill="#10b981" barSize={83} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendations */}
          <div className="mt-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Optimize electricity usage during peak hours</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Switch to energy-efficient lighting</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Implement recycling programs</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Use eco-friendly packaging materials</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Optimize delivery routes</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <span>Monitor and reduce idle time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Emission Reduction Simulator Page
  const EmissionReductionSimulator = () => {
    // Calculate current emissions from warehouse data
    const currentEmissions = warehouseData.reduce((acc, item) => {
      const category = item.name.toLowerCase();
      if (category.includes('electricity')) {
        acc.electricity += item.carbon;
      } else if (category.includes('plastic packaging')) {
        acc.packaging += item.carbon;
      } else if (category.includes('diesel')) {
        acc.diesel += item.carbon;
      } else if (category.includes('cardboard')) {
        acc.cardboard += item.carbon;
      }
      return acc;
    }, { electricity: 0, packaging: 0, diesel: 0, cardboard: 0 });

    // Calculate reduced emissions based on sliders
    const reducedEmissions = {
      electricity: currentEmissions.electricity * (1 - reductionFactors.electricity / 100),
      packaging: currentEmissions.packaging * (1 - reductionFactors.packaging / 100),
      diesel: currentEmissions.diesel * (1 - reductionFactors.diesel / 100),
      cardboard: currentEmissions.cardboard * (1 - reductionFactors.cardboard / 100)
    };

    const totalCurrentEmissions = Object.values(currentEmissions).reduce((sum, val) => sum + val, 0);
    const totalReducedEmissions = Object.values(reducedEmissions).reduce((sum, val) => sum + val, 0);
    const totalReduction = totalCurrentEmissions - totalReducedEmissions;
    const reductionPercentage = totalCurrentEmissions > 0 ? (totalReduction / totalCurrentEmissions) * 100 : 0;

    // Calculate trees saved
    const treesSaved = Math.ceil(totalReduction / 20);

    // Chart data for comparison
    const comparisonData = [
      { name: 'Electricity', current: currentEmissions.electricity, reduced: reducedEmissions.electricity },
      { name: 'Plastic Packaging', current: currentEmissions.packaging, reduced: reducedEmissions.packaging },
      { name: 'Diesel', current: currentEmissions.diesel, reduced: reducedEmissions.diesel },
      { name: 'Cardboard', current: currentEmissions.cardboard, reduced: reducedEmissions.cardboard }
    ];

    const handleSliderChange = (factor, value) => {
      setReductionFactors(prev => ({
        ...prev,
        [factor]: value
      }));
    };

    const resetSliders = () => {
      setReductionFactors({
        electricity: 0,
        packaging: 0,
        diesel: 0,
        cardboard: 0
      });
    };

    return (
      <div className="flex-1 bg-gradient-to-br from-green-50 to-blue-50 p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">Emission Reduction Simulator</h2>
            <p className="text-gray-600">Simulate how reducing different factors affects your carbon emissions</p>
          </div>

          {/* Current vs Reduced Emissions Summary */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-red-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{totalCurrentEmissions.toFixed(1)} kg</div>
              <div className="text-gray-600">Current Emissions</div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{totalReducedEmissions.toFixed(1)} kg</div>
              <div className="text-gray-600">Reduced Emissions</div>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{totalReduction.toFixed(1)} kg</div>
              <div className="text-gray-600">Emissions Saved</div>
            </div>
          </div>

          {/* Reduction Percentage and Trees Saved */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-lg text-center">
              <div className="text-4xl font-bold text-green-700 mb-2">{reductionPercentage.toFixed(1)}%</div>
              <div className="text-gray-700 text-lg">Overall Reduction</div>
            </div>
            <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-lg text-center">
              <div className="flex items-center justify-center">
                <div className="text-4xl font-bold text-green-700 mr-4">{treesSaved}</div>
                <img src={treeLogo} alt="tree" className="w-12 h-12" />
              </div>
              <div className="text-gray-700 text-lg">Trees Saved</div>
            </div>
          </div>

          {/* Reduction Sliders */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Adjust Reduction Factors</h3>
            <div className="space-y-6">
              {Object.entries(reductionFactors).map(([factor, value]) => (
                <div key={factor} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-lg font-semibold text-gray-700 capitalize">
                      {factor} Reduction
                    </label>
                    <span className="text-2xl font-bold text-green-600">{value}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handleSliderChange(factor, parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Current: {currentEmissions[factor].toFixed(1)} kg → Reduced: {reducedEmissions[factor].toFixed(1)} kg
                    <span className="text-green-600 font-semibold ml-2">
                      (Save {(currentEmissions[factor] - reducedEmissions[factor]).toFixed(1)} kg)
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={resetSliders}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Reset All Sliders
              </button>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Emissions Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} kg CO₂`, 'Emissions']} />
                <Bar dataKey="current" fill="#ef4444" name="Current Emissions" />
                <Bar dataKey="reduced" fill="#10b981" name="Reduced Emissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendations */}
          <div className="mt-8 bg-green-50 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">💡 Recommendations for Reduction</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Electricity Reduction:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Switch to LED lighting</li>
                  <li>• Install motion sensors</li>
                  <li>• Use energy-efficient HVAC systems</li>
                  <li>• Optimize warehouse layout for natural light</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Packaging & Cardboard Reduction:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Use reusable packaging materials</li>
                  <li>• Implement right-sizing strategies</li>
                  <li>• Switch to biodegradable materials</li>
                  <li>• Optimize packaging design</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Diesel Reduction:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Optimize delivery routes</li>
                  <li>• Use electric vehicles</li>
                  <li>• Implement just-in-time delivery</li>
                  <li>• Train drivers in eco-driving</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">General Tips:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Conduct regular energy audits</li>
                  <li>• Set reduction targets</li>
                  <li>• Monitor and track progress</li>
                  <li>• Engage employees in sustainability</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DemandForecastingPage = () => (
    <div className="flex-1 bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Demand Forecasting</h2>
          <p className="text-gray-600">Upload historical data and predict future demand patterns</p>
        </div>

        {/* CSV Upload Section */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">📁 Import Historical Data</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Upload size={20} />
                  <span>Upload CSV</span>
                </button>
                <button
                  onClick={downloadSampleCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Download size={20} />
                  <span>Download Sample</span>
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {csvFile && (
                <div className="bg-green-100 p-3 rounded-lg">
                  <p className="text-green-800">✅ File uploaded: {csvFile.name}</p>
                  <p className="text-sm text-green-600">Records loaded: {historicalData.length}</p>
                </div>
              )}
              
              {csvError && (
                <div className="bg-red-100 p-3 rounded-lg mt-2">
                  <p className="text-red-800">❌ {csvError}</p>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📋 CSV Format Requirements:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>date:</strong> YYYY-MM-DD format</li>
                <li>• <strong>item_name:</strong> Product name</li>
                <li>• <strong>quantity:</strong> Number of units</li>
                <li>• <strong>movement_type:</strong> "in" or "out"</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Forecasting Controls */}
        {historicalData.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🔮 Generate Forecast</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Item</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose an item...</option>
                  {getUniqueItems().map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Forecast Period (days)</label>
                <select
                  value={forecastPeriod}
                  onChange={(e) => setForecastPeriod(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                  <option value={60}>60 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={calculateDemandForecast}
                  disabled={!selectedItem}
                  className="w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Generate Forecast
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {forecastData.length > 0 && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {getHistoricalChartData().length}
                </div>
                <div className="text-gray-600">Historical Data Points</div>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {forecastData.length}
                </div>
                <div className="text-gray-600">Forecast Days</div>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {Math.round(forecastData.reduce((sum, item) => sum + item.quantity, 0) / forecastData.length)}
                </div>
                <div className="text-gray-600">Avg Daily Demand</div>
              </div>
              
              <div className="bg-orange-50 p-6 rounded-lg text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {forecastData.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
                <div className="text-gray-600">Total Forecasted</div>
              </div>
            </div>

            {/* Forecast Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Demand Forecast for {selectedItem}</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getCombinedChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} units`, 'Quantity']} />
                  <Line 
                    type="monotone" 
                    dataKey="quantity" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    name="Historical"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="quantity" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    name="Forecast"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Forecast Table */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Detailed Forecast</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Forecasted Quantity</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastData.map((item, index) => {
                      const cumulative = forecastData
                        .slice(0, index + 1)
                        .reduce((sum, forecastItem) => sum + forecastItem.quantity, 0);
                      
                      return (
                        <tr key={item.date} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">{item.date}</td>
                          <td className="border border-gray-200 px-4 py-2 font-semibold">{item.quantity} units</td>
                          <td className="border border-gray-200 px-4 py-2 text-gray-600">{cumulative} units</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">💡 Forecasting Insights</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Trend Analysis:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Based on {getHistoricalChartData().length} historical data points</li>
                    <li>• Using moving average and linear regression</li>
                    <li>• Forecast period: {forecastPeriod} days</li>
                    <li>• Average daily demand: {Math.round(forecastData.reduce((sum, item) => sum + item.quantity, 0) / forecastData.length)} units</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Recommendations:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Plan inventory based on forecasted demand</li>
                    <li>• Adjust reorder points accordingly</li>
                    <li>• Monitor actual vs forecasted demand</li>
                    <li>• Update forecasts with new data regularly</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {historicalData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Historical Data</h3>
            <p className="text-gray-600 mb-6">Upload a CSV file with historical warehouse data to start forecasting</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Upload Your First CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const AboutPage = () => (
    <div className="flex-1 bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-800 mb-8">About EcoWare</h2>

        <div className="space-y-6 text-gray-600">
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">What is EcoWare?</h3>
            <p className="text-lg leading-relaxed">
              <strong>EcoWare</strong> is a comprehensive smart warehouse platform for carbon emissions tracking and management, designed specifically for warehouse operations. Our platform helps businesses monitor, calculate, and reduce their environmental footprint through intelligent data analysis and actionable insights. EcoWare brings the power of a smart warehouse to your sustainability journey.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Key Features</h3>
            <ul className="space-y-3 text-lg">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-3 mr-3 flex-shrink-0"></span>
                <span><strong>Real-time Carbon Tracking:</strong> Monitor emissions from electricity consumption, packaging materials, diesel usage, and other warehouse activities</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-3 mr-3 flex-shrink-0"></span>
                <span><strong>Interactive Dashboard:</strong> Visualize your carbon footprint with dynamic charts and comprehensive data tables</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-3 mr-3 flex-shrink-0"></span>
                <span><strong>Offset Calculations:</strong> Automatically calculate the number of trees needed to offset your carbon emissions</span>
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-3 mr-3 flex-shrink-0"></span>
                <span><strong>Data-Driven Insights:</strong> Make informed decisions to optimize warehouse operations and reduce environmental impact</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">1</div>
                <h4 className="font-semibold text-gray-800 mb-2">Input Data</h4>
                <p>Enter your warehouse operation data including electricity usage, packaging materials, and diesel consumption.</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">2</div>
                <h4 className="font-semibold text-gray-800 mb-2">Calculate Emissions</h4>
                <p>Our system automatically calculates carbon emissions based on industry-standard conversion factors.</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">3</div>
                <h4 className="font-semibold text-gray-800 mb-2">Optimize Operations</h4>
                <p>Use the insights to make informed decisions and implement sustainable practices in your warehouse.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Why Choose Smart Warehouse?</h3>
            <p className="text-lg leading-relaxed">
              In today's world, sustainability is not just a responsibility but a business imperative. Smart Warehouse empowers businesses to take control of their environmental impact while maintaining operational efficiency. Our user-friendly interface and comprehensive analytics make it easy to track progress, identify improvement opportunities, and demonstrate your commitment to sustainability.
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-100 to-blue-100 p-6 rounded-lg">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Get Started Today</h3>
            <p className="text-lg">
              Join the movement towards sustainable warehouse operations. Start tracking your carbon emissions and discover how small changes can make a big difference for our planet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-8">
          <img src={ecowareLogo} alt="EcoWare Logo" className="h-10 w-auto" />
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setCurrentPage('intro')}
            className={`w-full text-left font-medium transition-colors ${
              currentPage === 'intro'
                ? 'text-green-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Intro
          </button>
          <div className="mt-10"></div>

          <button
            onClick={() => setCurrentPage('warehouse')}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === 'warehouse'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Warehouse Data
          </button>

          {/* New navigation item for Demand & Emissions Dashboard */}
          <button
            onClick={() => setCurrentPage('demand-emissions')}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === 'demand-emissions'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Demand & Emissions
          </button>

          <button
            onClick={() => setCurrentPage('carbon-footprint')}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === 'carbon-footprint'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Carbon Footprint
          </button>

          <button
            onClick={() => setCurrentPage('emission-reduction')}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === 'emission-reduction'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Emission Reduction
          </button>

          <button
            onClick={() => setCurrentPage('demand-forecasting')}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === 'demand-forecasting'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Demand Forecasting
          </button>

          <button
            onClick={() => setCurrentPage('total')}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === 'total'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Total
          </button>
        </nav>

        <div className="mt-8">
          <button
            onClick={() => setCurrentPage('about')}
            className={`w-full text-left font-medium transition-colors ${
              currentPage === 'about'
                ? 'text-green-700'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            About
          </button>
        </div>
      </div>

      {/* Main content */}
      {currentPage === 'intro' && <IntroPage />}
      {currentPage === 'warehouse' && <WarehouseDataPage />}
      {currentPage === 'demand-emissions' && <DemandEmissionsDashboard />}
      {currentPage === 'carbon-footprint' && <CarbonFootprintPage />}
      {currentPage === 'emission-reduction' && <EmissionReductionSimulator />}
      {currentPage === 'demand-forecasting' && <DemandForecastingPage />}
      {currentPage === 'total' && <TotalPage />}
      {currentPage === 'about' && <AboutPage />}
    </div>
  );
};

export default SmartWarehouseTracker; 