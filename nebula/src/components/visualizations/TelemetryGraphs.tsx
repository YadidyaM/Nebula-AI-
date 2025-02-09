import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
  Brush,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import { Battery, Cpu, AlertTriangle } from 'lucide-react';

interface TelemetryData {
  timestamp: string;
  power: number;
  battery: number;
  storage: number;
}

interface TelemetryGraphsProps {
  data: TelemetryData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-700 mb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.value.toFixed(2)} {entry.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const TelemetryGraphs: React.FC<TelemetryGraphsProps> = ({ data }) => {
  const [powerZoomRange, setPowerZoomRange] = useState<{ start: number; end: number } | null>(null);
  const [storageZoomRange, setStorageZoomRange] = useState<{ start: number; end: number } | null>(null);

  // Calculate thresholds and warning levels
  const powerWarningThreshold = 200;
  const powerCriticalThreshold = 250;
  const batteryWarningThreshold = 30;
  const storageWarningThreshold = 7000;

  // Calculate statistics
  const averagePower = data.reduce((acc, curr) => acc + curr.power, 0) / data.length;
  const averageBattery = data.reduce((acc, curr) => acc + curr.battery, 0) / data.length;
  const averageStorage = data.reduce((acc, curr) => acc + curr.storage, 0) / data.length;

  const maxPower = Math.max(...data.map(d => d.power));
  const minBattery = Math.min(...data.map(d => d.battery));
  const maxStorage = Math.max(...data.map(d => d.storage));

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Power</p>
              <p className="text-2xl font-semibold">{averagePower.toFixed(1)} W</p>
            </div>
            <Battery className={`h-8 w-8 ${maxPower > powerWarningThreshold ? 'text-yellow-500' : 'text-green-500'}`} />
          </div>
          {maxPower > powerWarningThreshold && (
            <div className="mt-2 flex items-center text-yellow-600 text-sm">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>High power consumption detected</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Battery Status</p>
              <p className="text-2xl font-semibold">{averageBattery.toFixed(1)}%</p>
            </div>
            <Battery className={`h-8 w-8 ${minBattery < batteryWarningThreshold ? 'text-red-500' : 'text-green-500'}`} />
          </div>
          {minBattery < batteryWarningThreshold && (
            <div className="mt-2 flex items-center text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>Low battery warning</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Storage Usage</p>
              <p className="text-2xl font-semibold">{(averageStorage / 1000).toFixed(1)} GB</p>
            </div>
            <Cpu className={`h-8 w-8 ${maxStorage > storageWarningThreshold ? 'text-yellow-500' : 'text-green-500'}`} />
          </div>
          {maxStorage > storageWarningThreshold && (
            <div className="mt-2 flex items-center text-yellow-600 text-sm">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>High storage usage</span>
            </div>
          )}
        </div>
      </div>

      {/* Power and Battery Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Power & Battery Telemetry</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="batteryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp"
                domain={powerZoomRange ? ['dataMin', 'dataMax'] : undefined}
              />
              <YAxis yAxisId="power" orientation="left" />
              <YAxis yAxisId="battery" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Warning Thresholds */}
              <ReferenceLine
                y={powerWarningThreshold}
                yAxisId="power"
                stroke="#ff7300"
                strokeDasharray="3 3"
                label="Warning"
              />
              <ReferenceLine
                y={powerCriticalThreshold}
                yAxisId="power"
                stroke="#ff0000"
                strokeDasharray="3 3"
                label="Critical"
              />
              <ReferenceLine
                y={batteryWarningThreshold}
                yAxisId="battery"
                stroke="#ff0000"
                strokeDasharray="3 3"
                label="Low Battery"
              />

              <Area 
                yAxisId="power"
                type="monotone" 
                dataKey="power" 
                stroke="#8884d8" 
                fillOpacity={1}
                fill="url(#powerGradient)"
                name="Power Consumption"
                unit=" W"
                isAnimationActive={false}
              />
              <Area 
                yAxisId="battery"
                type="monotone" 
                dataKey="battery" 
                stroke="#82ca9d" 
                fillOpacity={1}
                fill="url(#batteryGradient)"
                name="Battery Level"
                unit="%"
                isAnimationActive={false}
              />
              <Brush 
                dataKey="timestamp" 
                height={30} 
                stroke="#8884d8"
                onChange={(range) => {
                  if (range.startIndex !== undefined && range.endIndex !== undefined) {
                    setPowerZoomRange({
                      start: range.startIndex,
                      end: range.endIndex
                    });
                  }
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Storage Usage Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Storage Usage</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp"
                domain={storageZoomRange ? ['dataMin', 'dataMax'] : undefined}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Warning Threshold */}
              <ReferenceLine
                y={storageWarningThreshold}
                stroke="#ff7300"
                strokeDasharray="3 3"
                label="Warning"
              />

              <Line 
                type="monotone" 
                dataKey="storage" 
                stroke="#ff7300" 
                name="Storage Usage"
                unit=" MB"
                strokeWidth={2}
                dot={false}
              />
              <Brush 
                dataKey="timestamp" 
                height={30} 
                stroke="#ff7300"
                onChange={(range) => {
                  if (range.startIndex !== undefined && range.endIndex !== undefined) {
                    setStorageZoomRange({
                      start: range.startIndex,
                      end: range.endIndex
                    });
                  }
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TelemetryGraphs;