import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ padding: 16, width: "100%", color: "#e5e7eb" }}>{children}</main>
    </div>
  );
}
