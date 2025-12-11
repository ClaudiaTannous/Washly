// apps/frontend/app/workers/layout.js (or .jsx)

export const metadata = {
  title: "Washly",
  description: "Laundry service marketplace",
};

export default function WorkersLayout({ children }) {
  return (
    <div
      dir="rtl"
      style={{
        margin: 0,
        backgroundColor: "#EBF8FB",
        fontFamily: "Arial, sans-serif",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}
