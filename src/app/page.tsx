import { AllocationGrid } from "@/components/allocation-grid"
import { Navigation } from "@/components/navigation"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation currentPage="/" />
      <AllocationGrid />
    </main>
  )
}
