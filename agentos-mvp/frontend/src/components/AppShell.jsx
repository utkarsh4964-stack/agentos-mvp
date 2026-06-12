import { Link, useNavigate, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../lib/auth";

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItem = (to, label) => {
    const active = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active ? "bg-panel text-paper" : "text-mist hover:text-paper"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard">
              <Logo size={26} />
            </Link>
            <nav className="flex items-center gap-1">
              {navItem("/dashboard", "Pipelines")}
              {navItem("/dashboard/new", "New pipeline")}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-mist hidden sm:inline">
              {user?.plan_tier?.toUpperCase() || "FREE"} PLAN
            </span>
            <span className="text-sm text-paper hidden sm:inline">{user?.name || user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm font-medium text-mist hover:text-paper border border-line rounded-lg transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
