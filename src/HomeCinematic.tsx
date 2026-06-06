import { useEffect, useState } from "react";
import SunCalc from "suncalc";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

type ThemeMode = "light" | "dark" | "auto" | "scheduled";

export default function HomeCinematic() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [theme, setTheme] = useState<ThemeMode>("auto");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [pauseAnimation, setPauseAnimation] = useState(false);
  const [themeNotice, setThemeNotice] = useState("");
  const [showAbout, setShowAbout] = useState(false);

  const isAdmin = user?.role?.includes("SystemAdmin");
  const isPathologist = user?.role?.includes("Pathologist");

  useEffect(() => {
    const saved = localStorage.getItem("theme-mode") as ThemeMode | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme-mode", theme);
  }, [theme]);

  useEffect(() => {
    const applyTheme = () => {
      if (theme === "light") return setResolvedTheme("light");
      if (theme === "dark") return setResolvedTheme("dark");

      if (theme === "auto") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        return setResolvedTheme(prefersDark ? "dark" : "light");
      }

      if (theme === "scheduled") {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const times = SunCalc.getTimes(new Date(), latitude, longitude);
            const now = new Date();
            const isNight = now < times.sunrise || now > times.sunset;
            setResolvedTheme(isNight ? "dark" : "light");
            setThemeNotice("");
          },
          () => {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            setResolvedTheme(prefersDark ? "dark" : "light");
            setThemeNotice(
              "We couldn’t determine your location, so we’re using your system theme."
            );
          }
        );
      }
    };

    applyTheme();
  }, [theme]);

  const isDark = resolvedTheme === "dark";

  const watermarkOpacity = pauseAnimation ? 0.06 : isDark ? 0.12 : 0.14;
  const watermarkBrightness = pauseAnimation
    ? "brightness(120%)"
    : isDark
    ? "brightness(180%)"
    : "brightness(240%)";

  const logoSrc = isDark ? "/pathscribe-logo-dark.svg" : "/pathscribe-logo.svg";

  // ---------------------------
  // TILE COMPONENT (unchanged)
  // ---------------------------
  const Tile = ({
    title,
    subtitle,
    image,
    onClick,
  }: {
    title: string;
    subtitle?: string;
    image: string;
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        height: "200px",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        backgroundImage: `url(${image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow:
          "0 0 12px rgba(255,255,255,0.12), 0 8px 22px rgba(0,0,0,0.35)",
        transition:
          "transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "scale(1.03)";
        el.style.boxShadow =
          "0 0 16px rgba(255,255,255,0.18), 0 14px 32px rgba(0,0,0,0.45)";
        el.style.borderColor = "rgba(255,255,255,0.35)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "scale(1)";
        el.style.boxShadow =
          "0 0 12px rgba(255,255,255,0.12), 0 8px 22px rgba(0,0,0,0.35)";
        el.style.borderColor = "rgba(255,255,255,0.22)";
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.15))",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          color: "white",
          textShadow: "0 2px 6px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontSize: "20px", fontWeight: 700 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: "14px", opacity: 0.85 }}>{subtitle}</div>
        )}
      </div>
    </div>
  );

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        background: isDark
          ? "linear-gradient(135deg, #0f172a, #1e293b)"
          : "linear-gradient(135deg, #eef2ff, #f8fafc)",
        color: isDark ? "#e5e7eb" : "#111",
        position: "relative",
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          backgroundImage: `url('/main_background.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: "scale(1.06)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? "linear-gradient(to bottom right, rgba(255,255,255,0.18), rgba(255,255,255,0.06))"
              : "linear-gradient(to bottom right, rgba(0,0,0,0.28), rgba(0,0,0,0.10))",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? "radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.35))"
              : "radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.22))",
          }}
        />

        <img
          src={logoSrc}
          alt="Watermark"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "150px",
            height: "150px",
            opacity: watermarkOpacity,
            filter: watermarkBrightness,
            transform: "translate(-50%, -50%)",
            animation: pauseAnimation ? "none" : "spin 20s linear infinite",
            transition: "opacity 0.3s ease, filter 0.3s ease",
          }}
        />
      </div>

      {/* RIGHT PANEL WITH TILES */}
      <div
        style={{
          width: "520px",
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "24px",
        }}
      >
        <img
          src={logoSrc}
          alt="PathScribe AI"
          style={{
            width: "200px",
            display: "block",
            margin: "0 auto 16px",
          }}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          <Tile
            title="Performance"
            subtitle="System metrics and throughput"
            image="/performance.jpg"
            onClick={() => navigate("/admin/performance")}
          />

          <Tile
            title="Models"
            subtitle="AI model management"
            image="/models.jpg"
            onClick={() => navigate("/admin/models")}
          />

          {isPathologist && (
            <Tile
              title="My Cases"
              subtitle="Assigned worklist and active reviews"
              image="/worklist.jpg"
              onClick={() => navigate("/pathologist/worklist")}
            />
          )}

          {isAdmin && (
            <Tile
              title="Training Data"
              subtitle="Dataset management"
              image="/training.jpg"
              onClick={() => navigate("/admin/training-data")}
            />
          )}

          {isAdmin && (
            <Tile
              title="Audit Logs"
              subtitle="System activity and access logs"
              image="/logs.jpg"
              onClick={() => navigate("/admin/audit-logs")}
            />
          )}

          {isAdmin && (
            <Tile
              title="System Configuration"
              subtitle="Environment, licensing, and settings"
              image="/config.jpg"
              onClick={() => navigate("/admin/configuration")}
            />
          )}
        </div>
      </div>

      {/* THEME SELECTOR + HELP ICON */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        {/* Theme buttons */}
        <button
          onClick={() => setTheme("light")}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.06)",
            backdropFilter: "blur(4px)",
            cursor: "pointer",
          }}
        >
          ☀️
        </button>

        <button
          onClick={() => setTheme("dark")}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.06)",
            backdropFilter: "blur(4px)",
            cursor: "pointer",
          }}
        >
          🌙
        </button>

        <button
          onClick={() => setTheme("auto")}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.06)",
            backdropFilter: "blur(4px)",
            cursor: "pointer",
          }}
        >
          ⚙️
        </button>

        <button
          onClick={() => setShowAbout(true)}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(0,0,0,0.06)",
            backdropFilter: "blur(4px)",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ?
        </button>
      </div>

      {/* ABOUT MODAL */}
      {showAbout && (
        <div
          onClick={() => setShowAbout(false)}
          style={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? "rgba(0,0,0,0.55)"
              : "rgba(0,0,0,0.35)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "360px",
              padding: "28px",
              borderRadius: "12px",
              background: isDark
                ? "rgba(30,41,59,0.55)"
                : "rgba(255,255,255,0.55)",
              backdropFilter: "blur(12px)",
              border: isDark
                ? "1px solid rgba(255,255,255,0.22)"
                : "1px solid rgba(0,0,0,0.18)",
              boxShadow: isDark
                ? "0 8px 24px rgba(0,0,0,0.55)"
                : "0 8px 24px rgba(0,0,0,0.18)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
              PathScribe AI
            </h2>

            <p style={{ margin: "4px 0" }}>Version 0.9.0</p>
            <p style={{ margin: "4px 0" }}>Build: 20260211</p>
            <p style={{ margin: "4px 0" }}>Environment: Internal Preview</p>

            <div
              style={{
                height: "1px",
                background: isDark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.15)",
                margin: "16px 0",
              }}
            />

            <p style={{ margin: "4px 0" }}>
              Developed by the PathScribe AI Team
            </p>
            <p style={{ margin: "4px 0" }}>© 2026 PathScribe</p>

            {themeNotice && (
              <p
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  opacity: 0.8,
                }}
              >
                {themeNotice}
              </p>
            )}

            <button
              onClick={() => setShowAbout(false)}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                background: isDark
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(0,0,0,0.12)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

