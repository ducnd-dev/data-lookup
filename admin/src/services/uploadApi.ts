import api from './api'
import { fileApi } from './fileApi'

export interface UploadResponse {
  success: boolean
  message: string
  rowsCount: number
  jobId: string
  timestamp: string
}

export interface UploadError {
  success: false
  message: string
  error?: string
}

export const uploadApi = {
  /**
   * Upload a CSV or Excel file for data import
   */
  uploadDataFile(file: File, onProgress?: (progress: number) => void) {
    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    const isValidType = allowedTypes.indexOf(file.type) !== -1 || 
                       file.name.indexOf('.csv') !== -1 || 
                       file.name.indexOf('.xlsx') !== -1 || 
                       file.name.indexOf('.xls') !== -1

    if (!isValidType) {
      return new (window as any).Promise((resolve: any) => {
        resolve({
          success: false,
          message: 'Invalid file type. Please upload CSV or Excel files only.'
        })
      })
    }

    // Increased file size limit to 100MB for chunked upload
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      return new (window as any).Promise((resolve: any) => {
        resolve({
          success: false,
          message: 'File too large. Maximum size is 100MB.'
        })
      })
    }

    console.log('📤 Uploading file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      willUseChunks: file.size > 5 * 1024 * 1024 // 5MB threshold
    })

    // Use chunked upload for files larger than 5MB
    const chunkThreshold = 5 * 1024 * 1024 // 5MB
    if (file.size > chunkThreshold) {
      console.log('📦 Using chunked upload for large file')
      return this.uploadLargeFile(file, onProgress)
    } else {
      console.log('� Using direct upload for small file')
      return this.uploadSmallFile(file, onProgress)
    }
  },

  /**
   * Upload small file directly to data-import endpoint
   */
  uploadSmallFile(file: File, onProgress?: (progress: number) => void) {
    // Create FormData
    const formData = new FormData()
    formData.append('file', file)

    // Make API call
    return api.post<UploadResponse>('/data-import/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for file upload
      onUploadProgress: (progressEvent: any) => {
        if (progressEvent.total && onProgress) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100
          onProgress(progress)
        }
      }
    })
    .then((response: any) => {
      console.log('✅ Upload successful:', response.data)
      onProgress?.(100)
      return response.data
    })
    .catch((error: any) => {
      console.error('❌ Upload failed:', error)
      return this.handleUploadError(error)
    })
  },

  /**
   * Upload large file using chunked upload
   */
  uploadLargeFile(file: File, onProgress?: (progress: number) => void) {
    const chunkSize = 2 * 1024 * 1024 // 2MB chunks
    
    return fileApi.uploadFileInChunks(file, chunkSize, (progress) => {
      console.log(`📊 Chunk upload progress: ${progress.toFixed(1)}%`)
      onProgress?.(progress * 0.8) // Reserve 20% for processing
    })
    .then((result: any) => {
      console.log('✅ Chunked upload completed, processing file...')
      onProgress?.(80) // File uploaded, now processing
      
      // After chunks are uploaded, trigger data import processing
      return this.processUploadedFile(file.name, onProgress)
    })
    .catch((error: any) => {
      console.error('❌ Chunked upload failed:', error)
      return {
        success: false,
        message: error.message || 'Chunked upload failed',
        error: error.message
      }
    })
  },

  /**
   * Process the uploaded file for data import
   */
  processUploadedFile(filename: string, onProgress?: (progress: number) => void) {
    // Call the data-import endpoint with the uploaded file
    return api.post<UploadResponse>('/data-import/process-uploaded-file', {
      filename: filename
    }, {
      timeout: 300000, // 5 minutes for processing large files
    })
    .then((response: any) => {
      console.log('✅ File processing successful:', response.data)
      onProgress?.(100)
      return response.data
    })
    .catch((error: any) => {
      console.error('❌ File processing failed:', error)
      return this.handleUploadError(error)
    })
  },

  /**
   * Handle upload errors with appropriate messages
   */
  handleUploadError(error: any) {
    let errorMessage = 'Upload failed. Please try again.'
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication required. Please login again.'
    } else if (error.response?.status === 413) {
      errorMessage = 'File too large. Please upload a smaller file.'
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Upload timeout. Please try with a smaller file.'
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      message: errorMessage,
      error: error.response?.data?.error || error.message
    }
  },

  /**
   * Check upload job status
   */
  checkJobStatus(jobId: string) {
    return api.get(`/data-import/job/${jobId}`)
      .then(response => response.data)
      .catch(error => {
        console.error('Failed to check job status:', error)
        throw error
      })
  },

  /**
   * Download report file
   */
  downloadReport(fileName: string) {
    return api.get(`/data-import/download/${fileName}`, {
      responseType: 'blob'
    })
    .then(response => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    })
    .catch(error => {
      console.error('Failed to download report:', error)
      throw error
    })
  }
}

export default uploadApi