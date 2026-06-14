import React, { useState } from "react";
import {
  Brain,
  Send,
  Sparkles,
  TrendingUp,
  DollarSign,
  Users,
  Shield,
  Briefcase,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function ExecutiveCopilot() {
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("brief");

  const suggestedPrompts = [
    "Show top platform risks",
    "Generate executive summary",
    "Identify revenue opportunities",
    "Which counselors need attention?",
    "Predict application growth",
    "Show visa bottlenecks",
  ];

  const recommendations = [
    {
      title: "Revenue Opportunity",
      description:
        "UK applications increased 18% this month.",
      type: "growth",
    },
    {
      title: "Visa Risk",
      description:
        "Canada visa delays detected.",
      type: "risk",
    },
    {
      title: "Counselor Capacity",
      description:
        "3 counselors nearing workload limit.",
      type: "operations",
    },
  ];

  const tabs = [
    {
      id: "brief",
      label: "Executive Brief",
    },
    {
      id: "students",
      label: "Student Intelligence",
    },
    {
      id: "operations",
      label: "Operations",
    },
    {
      id: "revenue",
      label: "Revenue",
    },
    {
      id: "growth",
      label: "Growth",
    },
    {
      id: "compliance",
      label: "Compliance",
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "brief":
        return (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">
                Morning Executive Brief
              </h3>

              <ul className="space-y-2 text-sm">
                <li>
                  • Applications increased by 12%
                </li>
                <li>
                  • Revenue forecast ahead of target
                </li>
                <li>
                  • 4 visa cases require attention
                </li>
                <li>
                  • Automation coverage remains 98%
                </li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">
                Weekly Summary
              </h3>

              <p>
                Platform continues to perform above
                expectations with strong application
                growth and stable visa outcomes.
              </p>
            </div>
          </div>
        );

      case "students":
        return (
          <div className="space-y-3">
            <div className="border p-4 rounded-lg">
              Active Students: 1,248
            </div>

            <div className="border p-4 rounded-lg">
              High-Risk Students: 27
            </div>

            <div className="border p-4 rounded-lg">
              Offer Conversion Rate: 68%
            </div>
          </div>
        );

      case "operations":
        return (
          <div className="space-y-3">
            <div className="border p-4 rounded-lg">
              Counselor Capacity: 87%
            </div>

            <div className="border p-4 rounded-lg">
              Pending Tasks: 213
            </div>

            <div className="border p-4 rounded-lg">
              Workflow Health: Excellent
            </div>
          </div>
        );

      case "revenue":
        return (
          <div className="space-y-3">
            <div className="border p-4 rounded-lg">
              Monthly Revenue: $186,000
            </div>

            <div className="border p-4 rounded-lg">
              Forecast Revenue: $245,000
            </div>

            <div className="border p-4 rounded-lg">
              Collection Rate: 94%
            </div>
          </div>
        );

      case "growth":
        return (
          <div className="space-y-3">
            <div className="border p-4 rounded-lg">
              Lead Growth: +18%
            </div>

            <div className="border p-4 rounded-lg">
              Application Growth: +12%
            </div>

            <div className="border p-4 rounded-lg">
              Marketing ROI: 4.8x
            </div>
          </div>
        );

      case "compliance":
        return (
          <div className="space-y-3">
            <div className="border p-4 rounded-lg">
              Compliance Score: 98%
            </div>

            <div className="border p-4 rounded-lg">
              Audit Readiness: Good
            </div>

            <div className="border p-4 rounded-lg">
              Policy Violations: 0
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center gap-3">
          <Brain className="text-indigo-600" />

          <div>
            <h1 className="text-3xl font-bold">
              Executive Copilot
            </h1>

            <p className="text-gray-500">
              AI-powered executive decision support
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) =>
              setPrompt(e.target.value)
            }
            placeholder="Ask Executive AI..."
            className="flex-1 border rounded-lg px-4 py-3"
          />

          <button className="bg-indigo-600 text-white px-5 rounded-lg flex items-center gap-2">
            <Send size={16} />
            Ask
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {suggestedPrompts.map((item) => (
            <button
              key={item}
              className="border rounded-full px-3 py-1 text-sm"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(tab.id)
            }
            className={`p-3 rounded-lg border text-sm ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "bg-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-5">
        {renderContent()}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-xl p-5 bg-white">
          <TrendingUp className="mb-3 text-green-600" />

          <h3 className="font-semibold">
            Growth Intelligence
          </h3>

          <div className="text-3xl font-bold mt-2">
            +18%
          </div>
        </div>

        <div className="border rounded-xl p-5 bg-white">
          <DollarSign className="mb-3 text-emerald-600" />

          <h3 className="font-semibold">
            Revenue Intelligence
          </h3>

          <div className="text-3xl font-bold mt-2">
            $245K
          </div>
        </div>

        <div className="border rounded-xl p-5 bg-white">
          <Users className="mb-3 text-blue-600" />

          <h3 className="font-semibold">
            Student Intelligence
          </h3>

          <div className="text-3xl font-bold mt-2">
            1,248
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-4">
          AI Recommendations
        </h2>

        <div className="space-y-3">
          {recommendations.map((item) => (
            <div
              key={item.title}
              className="border rounded-lg p-4 flex justify-between"
            >
              <div>
                <div className="font-semibold">
                  {item.title}
                </div>

                <div className="text-sm text-gray-500">
                  {item.description}
                </div>
              </div>

              <Sparkles className="text-indigo-500" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <CheckCircle className="text-green-500 mb-2" />
          Executive Health
          <div className="text-2xl font-bold">
            98%
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <AlertTriangle className="text-red-500 mb-2" />
          Risks
          <div className="text-2xl font-bold">
            4
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <Shield className="text-blue-500 mb-2" />
          Compliance
          <div className="text-2xl font-bold">
            99%
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <Briefcase className="text-purple-500 mb-2" />
          Opportunities
          <div className="text-2xl font-bold">
            12
          </div>
        </div>
      </div>
    </div>
  );
}