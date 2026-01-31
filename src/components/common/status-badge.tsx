import { Badge } from "@/components/ui/badge";
import { SubscriptionStatus } from "@/types";

interface StatusBadgeProps {
  status: SubscriptionStatus | "ACTIVE" | "INACTIVE" | "DRAFT" | "SENT" | "PAID" | "CANCELLED" | "EXPIRED" | "GENERATED" | "FAILED";
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
      case "ACTIVE":
      case "PAID":
      case "GENERATED":
        return "success";
      case SubscriptionStatus.EXPIRED:
      case "EXPIRED":
      case "CANCELLED":
      case "FAILED":
        return "destructive";
      case SubscriptionStatus.PENDING:
      case "PENDING":
      case "DRAFT":
      case "SENT":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <Badge variant={getVariant()}>
      {label || status}
    </Badge>
  );
}
