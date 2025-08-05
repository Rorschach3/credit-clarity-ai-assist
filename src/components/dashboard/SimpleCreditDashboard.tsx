import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, AlertCircle, FileText
} from 'lucide-react';
import { usePersistentProfile } from "@/hooks/usePersistentProfile";
import { useDashboardMetrics } from "@/hooks/queries/useDashboardQueries";

const SimpleCreditDashboard: React.FC = () => {
  const { disputeProfile } = usePersistentProfile();
  const { 
    metrics, 
    rawData, 
    isLoading, 
    error
  } = useDashboardMetrics();

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Error loading dashboard data</p>
            <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Credit Repair Dashboard</h1>
        <p className="text-muted-foreground">
          {disputeProfile ? `Welcome back, ${disputeProfile.firstName}!` : 'Track your credit repair progress'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tradelines</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalTradelines || 0}</div>
            <p className="text-xs text-muted-foreground">All credit accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.negativeTradelines || 0}</div>
            <p className="text-xs text-muted-foreground">Items to dispute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Disputes</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics?.activeDisputes || 0}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.resolvedDisputes || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Credit Repair Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Negative Items Disputed</span>
              <span className="font-semibold">
                {metrics?.activeDisputes || 0} of {metrics?.negativeTradelines || 0}
              </span>
            </div>
            <Progress 
              value={
                (metrics?.negativeTradelines || 0) > 0 
                  ? ((metrics?.activeDisputes || 0) / (metrics?.negativeTradelines || 0)) * 100 
                  : 0
              } 
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              {metrics?.negativePercentage || 0}% of your accounts have negative items
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Positive Accounts:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {metrics?.positiveTradelines || 0}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Negative Accounts:</span>
                <Badge variant="destructive">
                  {metrics?.negativeTradelines || 0}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Success Rate:</span>
                <span className="font-semibold">{metrics?.disputeSuccessRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rawData?.disputes && rawData.disputes.length > 0 ? (
                rawData.disputes.slice(0, 5).map((dispute) => (
                  <div key={dispute.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div>
                      <p className="text-sm font-medium">Dispute #{dispute.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(dispute.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={
                      dispute.status === 'completed' ? 'default' : 'secondary'
                    }>
                      {dispute.status || 'pending'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No disputes yet. Upload a credit report to get started!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bureau Information */}
      {metrics?.bureauDistribution && (
        <Card>
          <CardHeader>
            <CardTitle>Tradelines by Bureau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.bureauDistribution.Experian}</p>
                <p className="text-sm text-muted-foreground">Experian</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.bureauDistribution.Equifax}</p>
                <p className="text-sm text-muted-foreground">Equifax</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{metrics.bureauDistribution.TransUnion}</p>
                <p className="text-sm text-muted-foreground">TransUnion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimpleCreditDashboard;