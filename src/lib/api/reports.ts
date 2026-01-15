import { getSupabaseClient } from '../supabase'
import { ProductionSummary, DailyEntry, Shed } from '../database.types'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const supabase = getSupabaseClient() as any

export interface ReportData {
    entries: DailyEntry[]
    summary: {
        totalCrates: number
        totalBirds: number
        totalMortality: number
        totalNonProduction: number
        avgBirds: number
        entryCount: number
    }
    sheds: Shed[]
    dateRange: {
        start: string
        end: string
    }
}

export async function getProductionSummary(options?: {
    shedId?: string
    months?: number
}): Promise<ProductionSummary[]> {
    const monthsToFetch = options?.months || 12

    let query = supabase
        .from('production_summary')
        .select('*, shed:sheds(*)')
        .gte('month', format(subMonths(new Date(), monthsToFetch), 'yyyy-MM-01'))
        .order('month', { ascending: false })

    if (options?.shedId) {
        query = query.eq('shed_id', options.shedId)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data || []
}

export async function generateReportData(options: {
    shedId?: string
    variant?: 'W' | 'B'
    startDate: string
    endDate: string
}): Promise<ReportData> {
    // Fetch entries
    let entriesQuery = supabase
        .from('daily_entries')
        .select('*, shed:sheds(*)')
        .gte('entry_date', options.startDate)
        .lte('entry_date', options.endDate)
        .order('entry_date', { ascending: true })

    if (options.shedId) {
        entriesQuery = entriesQuery.eq('shed_id', options.shedId)
    }

    const { data: entries, error: entriesError } = await entriesQuery

    if (entriesError) throw new Error(entriesError.message)

    // Filter by variant if specified
    let filteredEntries = entries || []
    if (options.variant) {
        filteredEntries = filteredEntries.filter(
            (entry: any) => entry.shed?.variant === options.variant
        )
    }

    // Fetch sheds for reference
    let shedsQuery = supabase.from('sheds').select('*')
    if (options.variant) {
        shedsQuery = shedsQuery.eq('variant', options.variant)
    }
    const { data: sheds, error: shedsError } = await shedsQuery

    if (shedsError) throw new Error(shedsError.message)

    // Calculate summary
    const summary = {
        totalCrates: filteredEntries.reduce((sum: number, e: any) => sum + (e.production_crates || 0), 0),
        totalBirds: filteredEntries.reduce((sum: number, e: any) => sum + (e.production_birds || 0), 0),
        totalMortality: filteredEntries.reduce((sum: number, e: any) => sum + (e.mortality || 0), 0),
        totalNonProduction: filteredEntries.reduce((sum: number, e: any) => sum + (e.non_production || 0), 0),
        avgBirds: filteredEntries.length > 0
            ? filteredEntries.reduce((sum: number, e: any) => sum + (e.total_birds || 0), 0) / filteredEntries.length
            : 0,
        entryCount: filteredEntries.length,
    }

    return {
        entries: filteredEntries,
        summary,
        sheds: sheds || [],
        dateRange: {
            start: options.startDate,
            end: options.endDate,
        },
    }
}

export function generatePDFReport(reportData: ReportData, title: string): Blob {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(20)
    doc.setTextColor(22, 163, 74) // Primary green
    doc.text(title, 14, 22)

    // Date range
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`Report Period: ${reportData.dateRange.start} to ${reportData.dateRange.end}`, 14, 32)
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 40)

    // Summary section
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text('Summary', 14, 55)

    const summaryData = [
        ['Total Production (Crates)', reportData.summary.totalCrates.toFixed(2)],
        ['Total Production (Birds)', reportData.summary.totalBirds.toString()],
        ['Total Mortality', reportData.summary.totalMortality.toString()],
        ['Total Non-Production', reportData.summary.totalNonProduction.toString()],
        ['Average Birds', reportData.summary.avgBirds.toFixed(0)],
        ['Total Entries', reportData.summary.entryCount.toString()],
    ]

    autoTable(doc, {
        startY: 60,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] },
    })

    // Detailed entries
    if (reportData.entries.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY || 100

        doc.setFontSize(14)
        doc.text('Daily Entries', 14, finalY + 15)

        const entriesData = reportData.entries.map((entry: any) => [
            entry.entry_date,
            entry.shed?.name || 'N/A',
            entry.production_crates.toFixed(2),
            entry.production_birds.toString(),
            entry.total_birds.toString(),
            entry.non_production.toString(),
            entry.mortality.toString(),
        ])

        autoTable(doc, {
            startY: finalY + 20,
            head: [['Date', 'Shed', 'Crates', 'Prod. Birds', 'Total Birds', 'Non-Prod', 'Mortality']],
            body: entriesData,
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] },
            styles: { fontSize: 8 },
        })
    }

    return doc.output('blob')
}

export function generateCSVReport(reportData: ReportData): string {
    const headers = ['Date', 'Shed', 'Variant', 'Production Crates', 'Production Birds', 'Total Birds', 'Non-Production', 'Mortality', 'Notes']

    const rows = reportData.entries.map((entry: any) => [
        entry.entry_date,
        entry.shed?.name || '',
        entry.shed?.variant || '',
        entry.production_crates,
        entry.production_birds,
        entry.total_birds,
        entry.non_production,
        entry.mortality,
        entry.notes || '',
    ])

    // Add summary row
    rows.push([])
    rows.push(['Summary'])
    rows.push(['Total Crates', '', '', reportData.summary.totalCrates])
    rows.push(['Total Production Birds', '', '', '', reportData.summary.totalBirds])
    rows.push(['Total Mortality', '', '', '', '', '', '', reportData.summary.totalMortality])
    rows.push(['Average Birds', '', '', '', '', reportData.summary.avgBirds.toFixed(0)])

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    return csvContent
}

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

export function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, filename)
}

export async function getDashboardStats() {
    const today = new Date()
    const startOfCurrentMonth = format(startOfMonth(today), 'yyyy-MM-dd')
    const endOfCurrentMonth = format(endOfMonth(today), 'yyyy-MM-dd')

    // Get current month entries
    const { data: currentMonthEntries, error: entriesError } = await supabase
        .from('daily_entries')
        .select('*')
        .gte('entry_date', startOfCurrentMonth)
        .lte('entry_date', endOfCurrentMonth)

    if (entriesError) throw new Error(entriesError.message)

    // Get shed count
    const { count: shedCount, error: shedError } = await supabase
        .from('sheds')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    if (shedError) throw new Error(shedError.message)

    // Get worker count
    const { count: workerCount, error: workerError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'worker')

    if (workerError) throw new Error(workerError.message)

    const entries = currentMonthEntries || []

    return {
        totalSheds: shedCount || 0,
        totalWorkers: workerCount || 0,
        monthlyProduction: {
            crates: entries.reduce((sum: number, e: any) => sum + (e.production_crates || 0), 0),
            birds: entries.reduce((sum: number, e: any) => sum + (e.production_birds || 0), 0),
        },
        monthlyMortality: entries.reduce((sum: number, e: any) => sum + (e.mortality || 0), 0),
        monthlyNonProduction: entries.reduce((sum: number, e: any) => sum + (e.non_production || 0), 0),
        monthlyTotalBirds: entries.reduce((sum: number, e: any) => sum + (e.total_birds || 0), 0),
        totalEntries: entries.length,
    }
}
