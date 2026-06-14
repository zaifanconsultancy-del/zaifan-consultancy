import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Workflow,
  TrendingUp,
  Brain,
  RefreshCw,
  Target,
} from "lucide-react";

export default function WorkflowIntelligence() {
  const [viewMode, setViewMode] = useState("overview");

  const stages = useMemo(
    () => [
      {
        stage: "Inquiry",
        health: 98,
        active: 245,
        delayed: 3,
      },
      {
        stage: "Planning",
        health: 95,
        active: 178,
        delayed: 5,
      },
      {
        stage: "Application",
        health: 97,
        active: 312,
        delayed: 8,
      },
      {
        stage: "Offer",
        health: 96,
        active: 201,
        delayed: 4,
      },
      {
        stage: "CAS",
        health: 91,
        active: 144,
        delayed: 12,
      },
      {
        stage: "Visa",
        health: 94,
        active: 118,
        delayed: 7,
      },
      {
        stage: "Payment",
        health: 99,
        active: 96,
        delayed: 1,
      },
      {
        stage: "Enrollment",
        health: 98,
        active: 83,
        delayed: 0,
      },
    ],
    []
  );

  const bottlenecks = [
    {
      workflow: "Offer → CAS",
      issue: "CAS processing delays",
      severity: "High",
    },
    {
      workflow: "Application Review",
      issue: "Document verification backlog",
      severity: "Medium",
    },
    {
      workflow: "Visa Documentation",
      issue: "Missing documents",
      severity: "Medium",
    },
  ];

  const recoveryQueue = [
    "Recover CAS backlog workflow",
    "Re-trigger stalled automation jobs",
    "Review delayed visa applications",
    "Reassign counselor workload",
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border rounded-xl p-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Workflow className="text-indigo-600" />
              Workflow Intelligence
            </h1>

            <p className="text-gray-500 mt-1">
              Workflow Monitoring, Detection & Recovery Engine
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("overview")}
              className={`px-4 py-2 rounded-lg ${
                viewMode === "overview"
                  ? "bg-indigo-600 text-white"
                  : "border"
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setViewMode("analytics")}
              className={`px-4 py-2 rounded-lg ${
                viewMode === "analytics"
                  ? "bg-indigo-600 text-white"
                  : "border"
              }`}
            >
              Analytics
            </button>

            <button className="border px-4 py-2 rounded-lg flex gap-2 items-center">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <Activity className="text-green-600 mb-2" />
          <div className="text-sm text-gray-500">
            Workflow Health
          </div>
          <div className="text-3xl font-bold">
            96%
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <Target className="text-blue-600 mb-2" />
          <div className="text-sm text-gray-500">
            Active Workflows
          </div>
          <div className="text-3xl font-bold">
            1,377
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <Clock className="text-orange-500 mb-2" />
          <div className="text-sm text-gray-500">
            Delayed Items
          </div>
          <div className="text-3xl font-bold">
            40
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <AlertTriangle className="text-red-500 mb-2" />
          <div className="text-sm text-gray-500">
            Critical Issues
          </div>
          <div className="text-3xl font-bold">
            3
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-4">
          Student Journey Workflow Health
        </h2>

        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">
                  Stage
                </th>
                <th className="text-left p-3">
                  Health
                </th>
                <th className="text-left p-3">
                  Active
                </th>
                <th className="text-left p-3">
                  Delayed
                </th>
              </tr>
            </thead>

            <tbody>
              {stages.map((item) => (
                <tr
                  key={item.stage}
                  className="border-b"
                >
                  <td className="p-3">
                    {item.stage}
                  </td>

                  <td className="p-3">
                    <span className="font-semibold text-green-600">
                      {item.health}%
                    </span>
                  </td>

                  <td className="p-3">
                    {item.active}
                  </td>

                  <td className="p-3">
                    {item.delayed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4">
            Bottleneck Detection
          </h2>

          <div className="space-y-3">
            {bottlenecks.map((item) => (
              <div
                key={item.workflow}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between">
                  <div className="font-semibold">
                    {item.workflow}
                  </div>

                  <div className="text-red-500">
                    {item.severity}
                  </div>
                </div>

                <div className="text-sm text-gray-600 mt-2">
                  {item.issue}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4">
            Recovery Queue
          </h2>

          <div className="space-y-3">
            {recoveryQueue.map((item) => (
              <div
                key={item}
                className="border rounded-lg p-3"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-4">
          Automation Coverage
        </h2>

        <div className="grid grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <Brain className="mb-2 text-indigo-600" />
            <div className="text-sm text-gray-500">
              Automation Coverage
            </div>

            <div className="text-3xl font-bold">
              98%
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <CheckCircle className="mb-2 text-green-600" />
            <div className="text-sm text-gray-500">
              Verification Coverage
            </div>

            <div className="text-3xl font-bold">
              99%
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <Workflow className="mb-2 text-blue-600" />
            <div className="text-sm text-gray-500">
              Active Automations
            </div>

            <div className="text-3xl font-bold">
              124
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <TrendingUp className="mb-2 text-purple-600" />
            <div className="text-sm text-gray-500">
              Recovery Success
            </div>

            <div className="text-3xl font-bold">
              96%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}