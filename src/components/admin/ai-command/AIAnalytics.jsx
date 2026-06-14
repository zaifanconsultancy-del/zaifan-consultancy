import React, { useMemo, useState } from "react";
import {
  Brain,
  TrendingUp,
  Activity,
  Target,
  Users,
  Bot,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  RefreshCw,
} from "lucide-react";

export default function AIAnalytics() {
  const [timeframe, setTimeframe] = useState("30d");

  const metrics = useMemo(
    () => [
      {
        title: "AI Usage",
        value: "18,452",
        growth: "+22%",
        icon: Brain,
        color: "text-indigo-600",
      },
      {
        title: "Recommendations",
        value: "4,218",
        growth: "+17%",
        icon: Target,
        color: "text-green-600",
      },
      {
        title: "Predictions",
        value: "1,143",
        growth: "+12%",
        icon: TrendingUp,
        color: "text-blue-600",
      },
      {
        title: "Automation Actions",
        value: "8,904",
        growth: "+29%",
        icon: Bot,
        color: "text-purple-600",
      },
    ],
    []
  );

  const aiModules = [
    {
      module: "Executive AI",
      usage: 98,
      accuracy: 94,
      status: "Healthy",
    },
    {
      module: "Risk Engine",
      usage: 96,
      accuracy: 92,
      status: "Healthy",
    },
    {
      module: "Opportunity Engine",
      usage: 94,
      accuracy: 90,
      status: "Healthy",
    },
    {
      module: "Forecast Engine",
      usage: 89,
      accuracy: 88,
      status: "Healthy",
    },
    {
      module: "Automation Intelligence",
      usage: 97,
      accuracy: 95,
      status: "Healthy",
    },
  ];

  const recommendations = [
    {
      title: "Revenue Forecast Accuracy",
      value: "94%",
    },
    {
      title: "Visa Prediction Accuracy",
      value: "88%",
    },
    {
      title: "Enrollment Prediction Accuracy",
      value: "91%",
    },
    {
      title: "Risk Detection Accuracy",
      value: "93%",
    },
  ];

  const adoptionStats = [
    {
      title: "Executive Usage",
      value: "96%",
    },
    {
      title: "Counselor Usage",
      value: "88%",
    },
    {
      title: "Automation Adoption",
      value: "98%",
    },
    {
      title: "AI Coverage",
      value: "95%",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border rounded-xl p-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex gap-2 items-center">
              <BarChart3 className="text-indigo-600" />
              AI Analytics
            </h1>

            <p className="text-gray-500 mt-1">
              AI Performance, Accuracy & Adoption Intelligence
            </p>
          </div>

          <div className="flex gap-2">
            {["30d", "90d", "6m", "12m"].map((item) => (
              <button
                key={item}
                onClick={() => setTimeframe(item)}
                className={`px-4 py-2 rounded-lg ${
                  timeframe === item
                    ? "bg-indigo-600 text-white"
                    : "border"
                }`}
              >
                {item.toUpperCase()}
              </button>
            ))}

            <button className="border px-4 py-2 rounded-lg flex items-center gap-2">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.title}
              className="bg-white border rounded-xl p-5"
            >
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    {metric.title}
                  </div>

                  <div className="text-3xl font-bold mt-2">
                    {metric.value}
                  </div>

                  <div className="text-green-600 text-sm mt-1">
                    {metric.growth}
                  </div>
                </div>

                <Icon
                  size={28}
                  className={metric.color}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4">
            AI Module Performance
          </h2>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">
                  Module
                </th>

                <th className="text-left p-3">
                  Usage
                </th>

                <th className="text-left p-3">
                  Accuracy
                </th>

                <th className="text-left p-3">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {aiModules.map((item) => (
                <tr
                  key={item.module}
                  className="border-b"
                >
                  <td className="p-3">
                    {item.module}
                  </td>

                  <td className="p-3">
                    {item.usage}%
                  </td>

                  <td className="p-3">
                    {item.accuracy}%
                  </td>

                  <td className="p-3">
                    <span className="text-green-600">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4">
            Prediction Accuracy
          </h2>

          <div className="space-y-3">
            {recommendations.map((item) => (
              <div
                key={item.title}
                className="border rounded-lg p-4 flex justify-between"
              >
                <span>{item.title}</span>

                <span className="font-bold text-green-600">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-4">
          AI Adoption Metrics
        </h2>

        <div className="grid grid-cols-4 gap-4">
          {adoptionStats.map((item) => (
            <div
              key={item.title}
              className="border rounded-lg p-4"
            >
              <div className="text-sm text-gray-500">
                {item.title}
              </div>

              <div className="text-3xl font-bold mt-2">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <CheckCircle className="text-green-600 mb-2" />

          <div className="text-sm text-gray-500">
            Recommendation Accuracy
          </div>

          <div className="text-3xl font-bold">
            93%
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <Activity className="text-blue-600 mb-2" />

          <div className="text-sm text-gray-500">
            AI Coverage Score
          </div>

          <div className="text-3xl font-bold">
            95%
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <Users className="text-indigo-600 mb-2" />

          <div className="text-sm text-gray-500">
            Active AI Users
          </div>

          <div className="text-3xl font-bold">
            412
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <AlertTriangle className="text-orange-500 mb-2" />

          <div className="text-sm text-gray-500">
            AI Issues
          </div>

          <div className="text-3xl font-bold">
            0
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-4">
          Executive AI Health
        </h2>

        <div className="grid grid-cols-5 gap-4">
          <div className="border rounded-lg p-4">
            <Brain className="mb-2 text-indigo-600" />
            <div className="text-sm text-gray-500">
              AI Health
            </div>
            <div className="text-3xl font-bold">
              98%
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <Target className="mb-2 text-green-600" />
            <div className="text-sm text-gray-500">
              Accuracy
            </div>
            <div className="text-3xl font-bold">
              93%
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <Bot className="mb-2 text-purple-600" />
            <div className="text-sm text-gray-500">
              Automation
            </div>
            <div className="text-3xl font-bold">
              98%
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <TrendingUp className="mb-2 text-blue-600" />
            <div className="text-sm text-gray-500">
              Adoption
            </div>
            <div className="text-3xl font-bold">
              94%
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <CheckCircle className="mb-2 text-green-600" />
            <div className="text-sm text-gray-500">
              Status
            </div>
            <div className="text-3xl font-bold">
              Good
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}