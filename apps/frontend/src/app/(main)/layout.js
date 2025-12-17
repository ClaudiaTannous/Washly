import MainLayout from "@/components/MainLayout";

export const metadata = {
  title: "Washly",
  description: "Professional laundry services at your doorstep",
};

export default function MainLayoutWrapper({ children }) {
  return (
    <html lang="en">
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
