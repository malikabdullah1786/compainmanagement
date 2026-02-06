'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { useImportCustomers } from '@/lib/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CSVUploaderProps {
    restaurantId: string
    onSuccess?: () => void
}

export function CSVUploader({ restaurantId, onSuccess }: CSVUploaderProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const importMutation = useImportCustomers()

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const csvFile = acceptedFiles[0]
        if (csvFile) {
            if (!csvFile.name.endsWith('.csv')) {
                toast.error('Please upload a CSV file')
                return
            }
            setFile(csvFile)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
    })

    async function handleUpload() {
        if (!file) return

        try {
            const result = await importMutation.mutateAsync({ restaurantId, file })
            const data = result.data

            toast.success(`Imported ${data.imported} customers`, {
                description: data.skipped > 0 ? `${data.skipped} rows skipped` : undefined,
            })

            setIsOpen(false)
            setFile(null)
            onSuccess?.()
        } catch (error: unknown) {
            toast.error('Failed to import customers')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-white">Import Customers</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Upload a CSV file with customer phone numbers
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={cn(
                            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
                            isDragActive
                                ? 'border-indigo-500 bg-indigo-500/10'
                                : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-3">
                            {file ? (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{file.name}</p>
                                        <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setFile(null)
                                        }}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <XCircle className="mr-1 h-4 w-4" />
                                        Remove
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                                        <Upload className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-300">
                                            {isDragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">CSV files only</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* CSV Format Info */}
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm text-slate-300">Expected CSV Format</CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4">
                            <code className="text-xs text-slate-400 block bg-slate-900 p-2 rounded">
                                phone, first_name, last_name, email, tags<br />
                                +12025551234, John, Doe, john@email.com, &quot;VIP, Friday-Regular&quot;
                            </code>
                        </CardContent>
                    </Card>

                    {/* Upload Button */}
                    <Button
                        onClick={handleUpload}
                        disabled={!file || importMutation.isPending}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                        {importMutation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Import Customers
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
