"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push("/analytics");
  }, [router]);
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">
          Redirecting to Dashboard...
        </h1>
        <p className="text-gray-500">Please wait</p>
      </div>
    </div>
  );
}
