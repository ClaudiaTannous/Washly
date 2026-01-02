// apps/frontend/app/workers/layout.jsx
import MainLayout from "@/components/MainLayout";

export const metadata = {
  title: "Washly",
  description: "Laundry service marketplace",
};

export default function WorkersLayout({ children }) {
  return (
    <MainLayout>
      <div
        style={{
          margin: 0,
          backgroundColor: "#EBF8FB",
          fontFamily: "Arial, sans-serif",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </MainLayout>
  );
}
