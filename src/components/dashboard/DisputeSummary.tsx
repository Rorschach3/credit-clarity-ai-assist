
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

export function DisputeSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispute Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Items</span>
            <span className="font-medium">12</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Disputed</span>
            <span className="font-medium">8</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Removed</span>
            <span className="font-medium text-green-600">3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">In Progress</span>
            <span className="font-medium text-yellow-600">5</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
