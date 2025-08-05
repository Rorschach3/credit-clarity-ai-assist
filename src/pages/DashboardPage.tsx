// src/pages/DashboardPage.tsx

import { useAuth } from "@/hooks/use-auth"
import { CreditNavbar } from "@/components/navbar/CreditNavbar"
import SimpleCreditDashboard from "@/components/dashboard/SimpleCreditDashboard"

const Dashboard = () => {
  useAuth()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CreditNavbar />
      <SimpleCreditDashboard />
    </div>
  )
}

export default Dashboard
