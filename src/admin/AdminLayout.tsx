//import Header from "../components/Header";
import { ReactNode } from "react";
import { NavLink } from "react-router-dom";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navItems = [
    { label: "Performance", path: "/admin/performance" },
    { label: "Models", path: "/admin/models" },
    { label: "Training Data", path: "/admin/training-data" },
    { label: "Configuration", path: "/admin/configuration" },
    { label: "Audit Logs", path: "/admin/audit-logs" }
  ];

  return (
  <div
    style={{
      display: "flex",
      minHeight: "100vh",
      width: "100%",
      background: "#f8fafc",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}
  >

      {/* LEFT SIDEBAR */}
      <aside
        style={{
          width: "240px",
          background: "white",
          borderRight: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          padding: "24px 0"
        }}
      >
        {/* Logo */}
        <div style={{ padding: "0 24px", marginBottom: "32px" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 700 200"
            style={{ height: "48px", width: "auto" }}
          >
            <defs>
              <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#0891B2" }} />
                <stop offset="100%" style={{ stopColor: "#0E7490" }} />
              </linearGradient>
            </defs>
            <polygon
              points="100,30 165,65 165,135 100,170 35,135 35,65"
              fill="url(#hexGradient)"
              stroke="#0E7490"
              strokeWidth="3"
            />
            <circle
              cx="100"
              cy="100"
              r="42"
              fill="#FFFFFF"
              stroke="#0E7490"
              strokeWidth="3"
            />
            <rect
              x="78"
              y="80"
              width="44"
              height="40"
              rx="2.5"
              fill="none"
              stroke="#0891B2"
              strokeWidth="2.5"
            />
            <line
              x1="84"
              y1="88"
              x2="116"
              y2="88"
              stroke="#0891B2"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="84"
              y1="96"
              x2="116"
              y2="96"
              stroke="#0891B2"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="84"
              y1="104"
              x2="102"
              y2="104"
              stroke="#0891B2"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <polyline
              points="84,111 91,116 116,94"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="200"
              y="125"
              fontFamily="'Inter', 'Segoe UI', Roboto, sans-serif"
              fontSize="72"
              fontWeight="700"
              fill="#1E293B"
            >
              PathScribe
              <tspan fontSize="36" fill="#0891B2" dy="-22" dx="6">
                AI
              </tspan>
            </text>
          </svg>
        </div>

        {/* Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                padding: "12px 24px",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: isActive ? "#0891B2" : "#475569",
                background: isActive ? "#f0fdfa" : "transparent",
                borderLeft: isActive ? "4px solid #0891B2" : "4px solid transparent",
                textDecoration: "none",
                transition: "0.2s"
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* TOP NAV */}
        <header
          style={{
            height: "64px",
            background: "white",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px"
          }}
        >
          <div style={{ fontSize: "1rem", color: "#64748b" }}>
            Admin Console
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                background: "#fef3c7",
                border: "1px solid #fde047",
                padding: "4px 12px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#92400e"
              }}
            >
              🔧 ADMIN
            </span>

            <span style={{ color: "#64748b", fontSize: "0.875rem" }}>
              System Admin
            </span>

            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, #0891B2 0%, #0E7490 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 600,
                fontSize: "0.875rem"
              }}
            >
              SA
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px 40px"
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
