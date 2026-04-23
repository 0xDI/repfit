import { Card, CardContent, CardHeader } from "@/components/ui/card"

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded-md bg-muted ${className || ""}`} />
}

export default function AdminLoading() {
    return (
        <div className="space-y-6">
            {/* Page header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>

            {/* Stats cards skeleton */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Chart skeleton */}
            <Card className="border-border/50">
                <CardHeader>
                    <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>

            {/* Table/list skeleton */}
            <Card className="border-border/50">
                <CardHeader>
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-64" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border/50">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-16" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
