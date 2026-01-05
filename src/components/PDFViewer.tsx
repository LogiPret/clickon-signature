import { useState, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, FileText, Loader2 } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  pdfUrl: string
  isOpen: boolean
  onClose: () => void
}

export function PDFViewer({ pdfUrl, isOpen, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [viewportHeight, setViewportHeight] = useState<number>(window.innerHeight)

  // Detect container width and viewport height for responsive PDF scaling
  // Uses window.innerHeight to handle iOS Safari URL bar appearing/disappearing
  useEffect(() => {
    const updateDimensions = () => {
      // Account for padding (16px on each side on mobile, more on desktop)
      const isMobile = window.innerWidth < 640
      const padding = isMobile ? 16 : 32
      const maxWidth = Math.min(window.innerWidth - padding * 2, 800)
      setContainerWidth(maxWidth)
      setViewportHeight(window.innerHeight)
      
      // Set initial scale based on screen size
      if (isMobile) {
        setScale(1.2)
      } else {
        setScale(1.0)
      }
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    // Also listen for visual viewport changes (iOS Safari URL bar)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateDimensions)
    }
    return () => {
      window.removeEventListener('resize', updateDimensions)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateDimensions)
      }
    }
  }, [isOpen])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }, [])

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1))
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages))
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.3))

  if (!isOpen) return null

  const isMobile = containerWidth < 500
  // Calculate modal height dynamically to handle iOS Safari URL bar
  const modalHeight = isMobile ? viewportHeight - 16 : Math.min(viewportHeight * 0.9, viewportHeight - 32)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col"
        style={{ height: modalHeight }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Contrat</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Toolbar - Compact on mobile */}
        <div className="flex items-center justify-center gap-1 sm:gap-4 p-2 sm:p-3 bg-gray-50 border-b border-gray-200 shrink-0">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Page precedente"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-xs sm:text-sm text-gray-600 min-w-16 sm:min-w-25 text-center">
            {isMobile ? `${pageNumber}/${numPages || '...'}` : `Page ${pageNumber} / ${numPages || '...'}`}
          </span>
          
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Page suivante"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-px h-5 sm:h-6 bg-gray-300 mx-1 sm:mx-2" />

          <button
            onClick={zoomOut}
            disabled={scale <= 0.3}
            className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom arriere"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <span className="text-xs sm:text-sm text-gray-600 min-w-10 sm:min-w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom avant"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* PDF Content - Scrollable on mobile */}
        <div className="flex-1 overflow-auto p-2 sm:p-4 bg-gray-100 flex justify-center">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="mt-3 text-sm text-gray-600">Chargement...</span>
            </div>
          )}
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error('PDF load error:', error)}
            loading=""
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              width={isMobile ? containerWidth : undefined}
              className="shadow-lg"
              renderTextLayer={!isMobile}
              renderAnnotationLayer={!isMobile}
            />
          </Document>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-white shrink-0">
          <button
            onClick={onClose}
            className="w-full btn-primary text-sm sm:text-base py-2.5 sm:py-3"
          >
            J'ai lu le contrat
          </button>
        </div>
      </div>
    </div>
  )
}

interface PDFButtonProps {
  onClick: () => void
}

export function PDFButton({ onClick }: PDFButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 group"
    >
      <FileText className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
      <div className="text-left">
        <p className="font-medium text-blue-900">Consulter le contrat</p>
        <p className="text-sm text-blue-600">Cliquez pour lire le document PDF</p>
      </div>
    </button>
  )
}
