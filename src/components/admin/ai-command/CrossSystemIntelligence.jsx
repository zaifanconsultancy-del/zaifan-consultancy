import React, { useMemo, useState } from "react";
import {
  Brain,
  Activity,
  AlertTriangle,
  TrendingUp,
  Shield,
  Users,
  DollarSign,
  GraduationCap,
  Network,
  Link,
  Target,
  CheckCircle,
} from "lucide-react";

export default function CrossSystemIntelligence() {
  const [activeView, setActiveView] = useState("signals");

  const systems = useMemo(
    () => [
      {
        name: "Student OS",
        health: 98,
        signals: 245,
        icon: Users,
      },
      {
        name: "Counselor OS",
        health: 99,
        signals: 122,
        icon: Users,
      },
      {
        name: "University OS",
        health: 98,
        signals: 74,
        icon: GraduationCap,
      },
      {
        name: "Application OS",
        health: 97,
        signals: 312,
        icon: Activity,
      },
      {
        name: "Visa OS",
        health: 96,
        signals: 118,
        icon: Shield,
      },
      {
        name: "Payment OS",
        health: 99,
        signals: 96,
        icon: DollarSign,
      },
      {
        name: "Finance OS",
        health: 98,
        signals: 44,
        icon: DollarSign,
      },
      {
        name: "Marketing OS",
        health: 97,
        signals: 61,
        icon: TrendingUp,
      },
      {
        name: "Agent OS",
        health: 98,
        signals: 53,
        icon: Target,
      },
      {
        name: "Compliance OS",
        health: 100,
        signals: 18,
        icon: Shield,
      },
    ],
    []
  );

  const intelligenceFeed = [
    {
      title: "Offer Growth Detected",
      impact: "High",
      insight:
        "Offer volume increased 14%, likely to increase CAS workload.",
    },
    {
      title: "Visa Processing Risk",
      impact: "Medium",
      insight:
        "Visa delays may affect payment collection timing.",
    },
    {
      title: "Agent Performance Increase",
      impact: "High",
      insight:
        "Applications expected to increase over next 60 days.",
    },
    {
      title: "Revenue Opportunity",
      impact: "High",
      insight:
        "Strong UK demand may increase enrollment revenue.",
    },
  ];

  const correlations = [
    {
      source: "Marketing Growth",
      target: "Application Growth",
      impact: "+21%",
    },
    {
      source: "Application Growth",
      target: "Offer Growth",
      impact: "+14%",
    },
    {
      source: "Offer Growth",
      target: "CAS Workload",
      impact: "+11%",
    },
    {
      source: "CAS Growth",
      target: "Visa Volume",
      impact: "+16%",
    },
    {
      source: "Visa Approvals",
      target: "Revenue Collection",
      impact: "+19%",
    },
  ];

  const risks = [
    "Visa delays impacting enrollment timing",
    "CAS workload exceeding projected capacity",
    "Counselor workload growth from agent expansion",
    "Payment collection delays affecting forecasts",
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border rounded-xl p-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex gap-2 items-center">
              <Network className="text-indigo-600" />
              Cross-System Intelligence
            </h1>

            <p className="text-gray-500 mt-1">
              Enterprise Correlation & Intelligence Engine
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveView("signals")}
              className={`px-4 py-2 rounded-lg ${
                activeView === "signals"
                  ? "bg-indigo-600 text-white"
                  : "border"
              }`}
            >
              Signals
            </button>

            <button
              onClick={() => setActiveView("correlations")}
              className={`px-4 py-2 rounded-lg ${
                activeView === "correlations"
                  ? "bg-indigo-600 text-white"
                  : "border"
              }`}
            >
              Correlations
            </button>

            <button
              onClick={() => setActiveView("risks")}
              className={`px-4 py-2 rounded-lg ${
                activeView === "risks"
                  ? "bg-indigo-600 text-white"
                  : "border"
              }`}
            >
              Risks
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <Brain className="text-indigo-600 mb-2" />
          <div className="text-sm text-gray-500">
            Intelligence Signals
          </div>
          <div className="text-3xl font-bold">
            1,143
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <Link className="text-green-600 mb-2" />
          <div className="text-sm text-gray-500">
            Correlations
          </div>
          <div className="text-3xl font-bold">
            284
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <AlertTriangle className="text-red-500 mb-2" />
          <div className="text-sm text-gray-500">
            Risk Signals
          </div>
          <div className="text-3xl font-bold">
            17
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <CheckCircle className="text-green-500 mb-2" />
          <div className="text-sm text-gray-500">
            Platform Health
          </div>
          <div className="text-3xl font-bold">
            98%
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-4">
          Enterprise System Signals
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {systems.map((system) => {
            const Icon = system.icon;

            return (
              <div
                key={system.name}
                className="border rounded-lg p-4 flex justify-between"
              >
                <div className="flex gap-3">
                  <Icon className="text-indigo-600" />

                  <div>
                    <div className="font-semibold">
                      {system.name}
                    </div>

                    <div className="text-sm text-gray-500">
                      {system.signals} Signals
                    </div>
                  </div>
                </div>

                <div className="font-bold text-green-600">
                  {system.health}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4">
            Intelligence Feed
          </h2>

          <div className="space-y-3">
            {intelligenceFeed.map((item) => (
              <div
                key={item.title}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between">
                  <div className="font-semibold">
                    {item.title}
                  </div>

                  <div className="text-indigo-600">
                    {item.impact}
                  </div>
                </div>

                <div className="text-sm text-gray-600 mt-2">
                  {item.insight}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4">
            Risk Correlation Engine
          </h2>

          <div className="space-y-3">
            {risks.map((risk) => (
              <div
                key={risk}
                className="border rounded-lg p-3 flex gap-2 items-center"
              >
                <AlertTriangle
                  size={16}
                  className="text-red-500"
                />

                {risk}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-4">
          Enterprise Correlation Map
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">
                Source
              </th>

              <th className="text-left p-3">
                Connected System
              </th>

              <th className="text-left p-3">
                Impact
              </th>
            </tr>
          </thead>

          <tbody>
            {correlations.map((item) => (
              <tr
                key={item.source}
                className="border-b"
              >
                <td className="p-3">
                  {item.source}
                </td>

                <td className="p-3">
                  {item.target}
                </td>

                <td className="p-3 font-semibold text-green-600">
                  {item.impact}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}