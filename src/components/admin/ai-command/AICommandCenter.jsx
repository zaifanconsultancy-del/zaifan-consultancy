import React, { useMemo, useState } from "react";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  Activity,
  Shield,
  Bot,
  CheckCircle,
  DollarSign,
  Users,
  FileText,
  GraduationCap,
  Search,
  RefreshCw,
} from "lucide-react";

export default function AICommandCenter() {
  const [search, setSearch] = useState("");

  const metrics = useMemo(
    () => [
      {
        label: "Students",
        value: 1248,
        icon: Users,
        color: "bg-blue-500",
      },
      {
        label: "Applications",
        value: 418,
        icon: FileText,
        color: "bg-purple-500",
      },
      {
        label: "Offers",
        value: 197,
        icon: GraduationCap,
        color: "bg-green-500",
      },
      {
        label: "Revenue",
        value: "$186K",
        icon: DollarSign,
        color: "bg-emerald-500",
      },
    ],
    []
  );

  const recommendations = [
    "Visa approvals trending up 14%",
    "CAS processing delay detected",
    "Agent conversion increased 9%",
    "Revenue forecast exceeds target",
    "University applications growing rapidly",
  ];

  const risks = [
    {
      title: "Visa Delay Risk",
      severity: "High",
    },
    {
      title: "CAS Processing Backlog",
      severity: "Medium",
    },
    {
      title: "Payment Follow-up Queue",
      severity: "Low",
    },
  ];

  const systems = [
    "Student OS",
    "Counselor OS",
    "University OS",
    "Application OS",
    "Visa OS",
    "Payment OS",
    "Finance OS",
    "Marketing OS",
    "Compliance OS",
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl border p-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="w-8 h-8 text-indigo-600" />
              AI Command Center
            </h1>
            <p className="text-gray-500 mt-1">
              Executive Intelligence Layer
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search intelligence..."
                className="pl-10 border rounded-lg px-4 py-2"
              />
            </div>

            <button className="border rounded-lg px-4 py-2 flex gap-2 items-center">
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="bg-white border rounded-xl p-5"
            >
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    {item.label}
                  </div>

                  <div className="text-3xl font-bold mt-2">
                    {item.value}
                  </div>
                </div>

                <div
                  className={`${item.color} h-12 w-12 rounded-lg flex items-center justify-center text-white`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-500" />
            Risk Center
          </h2>

          <div className="space-y-3">
            {risks.map((risk) => (
              <div
                key={risk.title}
                className="border rounded-lg p-3"
              >
                <div className="font-medium">
                  {risk.title}
                </div>

                <div className="text-sm text-red-600">
                  {risk.severity}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <TrendingUp className="text-green-600" />
            Opportunity Center
          </h2>

          <div className="space-y-3">
            {recommendations.map((item) => (
              <div
                key={item}
                className="border rounded-lg p-3"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Shield className="text-blue-600" />
            Platform Health
          </h2>

          <div className="space-y-2">
            {systems.map((system) => (
              <div
                key={system}
                className="flex justify-between border-b py-2"
              >
                <span>{system}</span>

                <CheckCircle
                  size={16}
                  className="text-green-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4">
            Executive Recommendations
          </h2>

          <div className="space-y-3">
            {recommendations.map((item) => (
              <div
                key={item}
                className="border rounded-lg p-3"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4">
            AI Alert Feed
          </h2>

          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              CAS backlog increasing
            </div>

            <div className="border rounded-lg p-3">
              Payment confirmations delayed
            </div>

            <div className="border rounded-lg p-3">
              Application conversion improving
            </div>

            <div className="border rounded-lg p-3">
              Marketing campaign outperforming
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-4">
          Automation & Verification Snapshot
        </h2>

        <div className="grid grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <Bot className="mb-2 text-indigo-600" />
            <div className="font-semibold">
              Automation Coverage
            </div>
            <div className="text-3xl font-bold">
              98%
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <Activity className="mb-2 text-green-600" />
            <div className="font-semibold">
              Verification Health
            </div>
            <div className="text-3xl font-bold">
              99%
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <CheckCircle className="mb-2 text-blue-600" />
            <div className="font-semibold">
              Active Workflows
            </div>
            <div className="text-3xl font-bold">
              124
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <AlertTriangle className="mb-2 text-red-500" />
            <div className="font-semibold">
              Critical Alerts
            </div>
            <div className="text-3xl font-bold">
              3
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}