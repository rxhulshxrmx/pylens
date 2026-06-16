import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      <Sidebar />
      <MainContent />
    </div>
  );
}
