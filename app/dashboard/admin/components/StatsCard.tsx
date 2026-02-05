import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'blue' | 'green' | 'purple' | 'orange';
  loading?: boolean;
}

const variants = {
  blue: "from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-200/50",
  green: "from-green-500/10 to-green-500/5 text-green-600 border-green-200/50",
  purple: "from-purple-500/10 to-purple-500/5 text-purple-600 border-purple-200/50",
  orange: "from-orange-500/10 to-orange-500/5 text-orange-600 border-orange-200/50",
};

const iconVariants = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  orange: "bg-orange-100 text-orange-600",
};

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  variant = 'blue',
  loading
}: StatsCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br",
      variants[variant]
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium opacity-80">{title}</p>
            {loading ? (
              <div className="h-8 w-16 bg-foreground/10 animate-pulse rounded" />
            ) : (
              <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
            )}
          </div>
          <div className={cn("p-2 rounded-full", iconVariants[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-muted-foreground">{description}</span>
        </div>
        
        {/* Decorative background circle */}
        <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-current opacity-[0.03]" />
      </CardContent>
    </Card>
  );
}
