import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  GraduationCap,
  Globe,
  Calendar,
  Brain,
  AlertTriangle,
  Target,
} from "lucide-react";

export default function PredictiveInsights() {
  const [timeframe, setTimeframe] = useState("90");

  const forecasts = useMemo(
    () => [
      {
        title: "Enrollment Forecast",
        value: 342,
        change: "+18%",
        icon: Users,
        color: "text-blue-600",
      },
      {
        title: "Revenue Forecast",
        value: "$245K",
        change: "+14%",
        icon: DollarSign,
        color: "text-green-600",
      },
      {
        title: "Applications Forecast",
        value: 518,
        change: "+21%",
        icon: FileText,
        color: "text-purple-600",
      },
      {
        title: "Offer Forecast",
        value: 267,
        change: "+16%",
        icon: GraduationCap,
        color: "text-emerald-600",
      },
    ],
    []
  );

  const predictions = [
    {
      category: "Enrollment",
      prediction:
        "Expected increase in UK enrollments due to strong offer conversion.",
      confidence: "92%",
    },
    {
      category: "Revenue",
      prediction:
        "Revenue expected to exceed monthly target by 14%.",
      confidence: "89%",
    },
    {
      category: "Visa",
      prediction:
        "Visa approval rates likely to remain above 90%.",
      confidence: "87%",
    },
    {
      category: "Agent Growth",
      prediction:
        "Top performing agents expected to generate 22% more applications.",
      confidence: "84%",
    },
  ];

  const opportunities = [
    "Expand UK recruitment campaigns",
    "Increase counselor capacity",
    "Improve visa documentation automation",
    "Launch referral incentive program",
  ];

  const risks = [
    "CAS processing delays",
    "Visa regulation changes",
    "Seasonal application slowdown",
    "Payment collection bottlenecks",
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border rounded-xl p-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="text-indigo-600" />
              Predictive Insights
            </h1>

            <p className="text-gray-500 mt-1">
              Enterprise Forecasting & Prediction Engine
            </p>
          </div>

          <div className="flex gap-2">
            {[
              { label: "30 Days", value: "30" },
              { label: "90 Days", value: "90" },
              { label: "6 Months", value: "180" },
              { label: "12 Months", value: "365" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setTimeframe(item.value)}
                className={`px-4 py-2 rounded-lg border ${
                  timeframe === item.value
                    ? "bg-indigo-600 text-white"
                    : "bg-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {forecasts.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-white border rounded-xl p-5"
            >
              <div className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    {item.title}
                  </div>

                  <div className="text-3xl font-bold mt-2">
                    {item.value}
                  </div>

                  <div className="text-green-600 text-sm mt-1">
                    {item.change}
                  </div>
                </div>

                <Icon
                  className={`${item.color}`}
                  size={28}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-600" />
            Forecast Predictions
          </h2>

          <div className="space-y-4">
            {predictions.map((item) => (
              <div
                key={item.category}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between">
                  <div className="font-semibold">
                    {item.category}
                  </div>

                  <div className="text-green-600">
                    {item.confidence}
                  </div>
                </div>

                <div className="text-sm text-gray-600 mt-2">
                  {item.prediction}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="text-indigo-600" />
            Strategic Opportunities
          </h2>

          <div className="space-y-3">
            {opportunities.map((item) => (
              <div
                key={item}
                className="border rounded-lg p-3"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-3">
              Key Risks
            </h3>

            <div className="space-y-3">
              {risks.map((item) => (
                <div
                  key={item}
                  className="border rounded-lg p-3 flex gap-2 items-center"
                >
                  <AlertTriangle
                    size={16}
                    className="text-red-500"
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-4">
          Forecast Breakdown
        </h2>

        <div className="grid grid-cols-5 gap-4">
          <div className="border rounded-lg p-4">
            <Users className="mb-2 text-blue-600" />
            <div className="font-medium">
              Enrollment
            </div>
            <div className="text-2xl font-bold">
              342
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <DollarSign className="mb-2 text-green-600" />
            <div className="font-medium">
              Revenue
            </div>
            <div className="text-2xl font-bold">
              $245K
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <FileText className="mb-2 text-purple-600" />
            <div className="font-medium">
              Applications
            </div>
            <div className="text-2xl font-bold">
              518
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <Globe className="mb-2 text-orange-600" />
            <div className="font-medium">
              Visa Approvals
            </div>
            <div className="text-2xl font-bold">
              221
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <Calendar className="mb-2 text-indigo-600" />
            <div className="font-medium">
              Active Intakes
            </div>
            <div className="text-2xl font-bold">
              7
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-4">
          Prediction Accuracy
        </h2>

        <div className="grid grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">
              Enrollment Accuracy
            </div>

            <div className="text-3xl font-bold">
              91%
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">
              Revenue Accuracy
            </div>

            <div className="text-3xl font-bold">
              94%
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">
              Visa Accuracy
            </div>

            <div className="text-3xl font-bold">
              88%
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-500">
              Agent Accuracy
            </div>

            <div className="text-3xl font-bold">
              86%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}