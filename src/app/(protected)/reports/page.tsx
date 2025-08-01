// src/app/(protected)/reports/page.tsx
import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReportsDashboard } from "@/components/reports/reports-dashboard"
import { ConsumptionReport } from "@/components/reports/consumption-report"
import { BillingReport } from "@/components/reports/billing-report"
import { SensorsReport } from "@/components/reports/sensors-report"
import { AlarmsReport } from "@/components/reports/alarms-report"

export default function ReportsPage() {
    return (
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Reportes</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Análisis y reportes del sistema de monitoreo
                    </p>
                </div>
            </div>

            <Tabs defaultValue="consumption" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto">
                    <TabsTrigger value="consumption" className="text-xs sm:text-sm">Consumo</TabsTrigger>
                    <TabsTrigger value="billing" className="text-xs sm:text-sm">Facturación</TabsTrigger>
                    <TabsTrigger value="sensors" className="text-xs sm:text-sm">Sensores</TabsTrigger>
                    <TabsTrigger value="alarms" className="text-xs sm:text-sm">Alarmas</TabsTrigger>
                </TabsList>



                <TabsContent value="consumption">
                    <Suspense fallback={<div className="text-center py-8">Cargando reporte de consumo...</div>}>
                        <ConsumptionReport />
                    </Suspense>
                </TabsContent>

                <TabsContent value="billing">
                    <Suspense fallback={<div className="text-center py-8">Cargando reporte de facturación...</div>}>
                        <BillingReport />
                    </Suspense>
                </TabsContent>

                <TabsContent value="sensors">
                    <Suspense fallback={<div className="text-center py-8">Cargando reporte de sensores...</div>}>
                        <SensorsReport />
                    </Suspense>
                </TabsContent>

                <TabsContent value="alarms">
                    <Suspense fallback={<div className="text-center py-8">Cargando reporte de alarmas...</div>}>
                        <AlarmsReport />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    )
}